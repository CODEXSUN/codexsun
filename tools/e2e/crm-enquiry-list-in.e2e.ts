import assert from "node:assert/strict";
import { test } from "node:test";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { env } from "../../apps/platform/api/src/env.js";
import { EnquiryRepository } from "../../apps/crm/api/src/modules/enquiry/enquiry.repository.js";
import type {
  EnquiryDatabase,
  EnquiryListOptions
} from "../../apps/crm/api/src/modules/enquiry/enquiry.types.js";
import { ListInRepository } from "../../apps/crm/api/src/modules/list-in/list-in.repository.js";
import type { ListInDatabase } from "../../apps/crm/api/src/modules/list-in/list-in.types.js";
import {
  groupRows,
  reportDrilldown
} from "../../apps/crm/web/src/modules/reports/reports.model.js";

assert.equal(env.NODE_ENV, "development", "This suite only reads the local development database.");
assert.notEqual(env.DEFAULT_TENANT_DB_NAME, env.DB_MASTER_NAME);

const database = new Kysely<EnquiryDatabase>({
  dialect: new MysqlDialect({
    pool: createPool({
      database: env.DEFAULT_TENANT_DB_NAME,
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      timezone: "Z",
      connectionLimit: 2
    })
  })
});

const base: EnquiryListOptions = {
  scope: "all",
  page: 1,
  pageSize: 100,
  search: "",
  filter: "all",
  actorEmail: "",
  actorUserId: null,
  canViewAll: true
};

test("CRM enquiry and List In queries match in the local database", async (suite) => {
  suite.after(() => database.destroy());

  await database
    .transaction()
    .setIsolationLevel("repeatable read")
    .execute(async (transaction) => {
      const enquiries = new EnquiryRepository(transaction);
      // EnquiryDatabase includes ListInDatabase, but Kysely's generic is invariant.
      const listRepository = new ListInRepository(transaction as unknown as Kysely<ListInDatabase>);
      const lists = await listRepository.list();
      const listById = new Map(lists.map((list) => [list.id, list.name]));
      const reference = await sql<{ listInId: number | null; total: number }>`
      SELECT list_in_id AS listInId, COUNT(*) AS total
      FROM crm_enquiries
      GROUP BY list_in_id
    `.execute(transaction);
      const counts = new Map(reference.rows.map((row) => [row.listInId, Number(row.total)]));
      const reportRows = await enquiries.report(base);
      const reportGroups = groupRows(reportRows, "list-in", []);
      const all = await enquiries.listPage(base);

      await suite.test("report and list totals equal the database reference", () => {
        assert.ok(all.total > 0, "The local CRM database needs enquiry records for this suite.");
        assert.ok(
          [...counts.keys()].some((id) => id !== null),
          "The local CRM database needs an enquiry linked to List In."
        );
        assert.equal(
          all.total,
          [...counts.values()].reduce((sum, count) => sum + count, 0)
        );
        assert.equal(
          reportGroups.reduce((sum, group) => sum + group.total, 0),
          all.total
        );
        for (const group of reportGroups) {
          const id = group.key === "none" ? null : Number(group.key);
          assert.equal(group.total, counts.get(id));
          assert.equal(group.label, id === null ? "(no group)" : listById.get(id));
        }
      });

      await suite.test("each List In drilldown returns only its matching enquiries", async () => {
        for (const group of reportGroups) {
          const drilldown = reportDrilldown("list-in", group.key, {});
          const page = await enquiries.listPage({ ...base, ...drilldown });
          const id = group.key === "none" ? null : Number(group.key);
          assert.equal(page.total, group.total, `List In ${group.key} total differs.`);
          if (id !== null) assert.equal(await listRepository.usageCount(id), group.total);
          assert.ok(page.items.every((item) => item.listInId === id));
          assert.ok(
            page.items.every((item) => item.listIn === (id === null ? null : listById.get(id)))
          );
          for (const [bucket, count] of group.counts) {
            const filtered = await enquiries.listPage({
              ...base,
              ...reportDrilldown("list-in", group.key, {}, bucket)
            });
            assert.equal(filtered.total, count, `List In ${group.key}, ${bucket} differs.`);
          }
        }
      });

      await suite.test("List In column search matches the database query", async () => {
        const sample = lists.find((list) => counts.has(list.id) && !/[%_]/u.test(list.name));
        assert.ok(sample, "No linked List In name is available for the search check.");
        const term = `%${sample.name}%`;
        const expected = await sql<{ total: number }>`
        SELECT COUNT(*) AS total
        FROM crm_enquiries enquiry
        INNER JOIN crm_enquiry_lists list_in ON list_in.id = enquiry.list_in_id
        WHERE list_in.name LIKE ${term}
      `.execute(transaction);
        const page = await enquiries.listPage({ ...base, searchListIn: sample.name });
        assert.equal(page.total, Number(expected.rows[0]?.total));
      });

      await suite.test("date and assignee report filters match enquiry drilldowns", async () => {
        const samples = await sql<{
          enquiryDay: string;
          assignedUserId: number | null;
          total: number;
        }>`
          SELECT DATE_FORMAT(enquired_at, '%Y-%m-%d') AS enquiryDay,
            assigned_user_id AS assignedUserId, COUNT(*) AS total
          FROM crm_enquiries
          GROUP BY enquiryDay, assigned_user_id
          ORDER BY total DESC
          LIMIT 1
        `.execute(transaction);
        const sample = samples.rows[0];
        assert.ok(sample);
        const fromAt = `${sample.enquiryDay}T00:00:00.000Z`;
        const toAt = new Date(Date.parse(fromAt) + 86_400_000).toISOString();
        const filters = {
          fromAt,
          toAt,
          assignedUserId: sample.assignedUserId === null ? "none" : String(sample.assignedUserId)
        };
        const report = await enquiries.report({ ...base, ...filters });
        const page = await enquiries.listPage({ ...base, ...filters });
        assert.equal(page.total, Number(sample.total));
        assert.equal(
          report.reduce((sum, row) => sum + row.count, 0),
          page.total
        );
        for (const group of groupRows(report, "list-in", [])) {
          const drilldown = await enquiries.listPage({ ...base, ...filters, listInId: group.key });
          assert.equal(drilldown.total, group.total);
        }
      });

      console.log(`Checked ${all.total} enquiries across ${reportGroups.length} List In groups.`);
    });
});
