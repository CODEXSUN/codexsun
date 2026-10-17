import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import Fastify from "fastify";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../../apps/platform/api/src/env.js";
import { TenantRepository } from "../../apps/platform/api/src/modules/tenant/tenant.repository.js";
import {
  getTenantDatabase,
  closeAllTenantDatabases
} from "../../apps/platform/api/src/database/tenant-database.js";
import { closePlatformDatabase } from "../../apps/platform/api/src/database/platform-database.js";
import { migrateTenantUserModule } from "../../apps/platform/api/src/modules/tenant-user/tenant-user.migration.js";
import { FrappeConnectionAccess } from "../../apps/frappe/api/src/modules/connection/connection.access.js";
import { requestFrappe } from "../../apps/frappe/api/src/modules/connection/index.js";
import type { FrappeDatabase } from "../../apps/frappe/api/src/modules/connection/index.js";
import { mappedEmployeeCodeForLocalUser } from "../../apps/frappe/api/src/modules/user-mapping/user-mapping.repository.js";
import type { FrappeUserMappingDatabase } from "../../apps/frappe/api/src/modules/user-mapping/user-mapping.types.js";
import { processCrmDutySync } from "../../apps/frappe/api/src/modules/crm-duty-sync/crm-duty-sync.worker.js";
import { resolveDutyDepartment } from "../../apps/frappe/api/src/modules/crm-duty-sync/crm-duty-sync.mapping.js";
import { sopModule, migrateSopModule } from "../../apps/crm/api/src/modules/sop/index.js";
import {
  sopItemModule,
  migrateSopItemModule
} from "../../apps/crm/api/src/modules/sop-item/index.js";
import {
  dutyAssignmentModule,
  migrateDutyAssignmentModule
} from "../../apps/crm/api/src/modules/duty-assignment/index.js";
import {
  dutyReportModule,
  migrateDutyReportModule,
  type DutyReportDatabase
} from "../../apps/crm/api/src/modules/duty-report/index.js";
import {
  migrateFrappeSyncModule,
  enqueueCrmFrappeSync
} from "../../apps/crm/api/src/modules/frappe-sync/index.js";

type RemoteDocument = {
  name: string;
  steps: string;
  actions: string;
  [key: string]: string | number;
};
type Field = { fieldname: string; fieldtype: string; options?: string };
const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../apps/frappe/api/src/modules/crm-duty-sync/fixtures/logicx-duty-contract.json",
      import.meta.url
    ),
    "utf8"
  )
);

test(
  "live Frappe receives and returns every mapped SOP and Duty field",
  { timeout: 180_000 },
  async (suite) => {
    suite.after(async () => {
      await closeAllTenantDatabases();
      await closePlatformDatabase();
    });
    const tenantCode = process.env.CODEXSUN_FRAPPE_LIVE_TENANT || env.DEFAULT_TENANT_CORPORATE_ID;
    const tenant = await new TenantRepository().findByIdOrCode(tenantCode);
    assert.ok(
      tenant && tenant.status === "active",
      "Choose an active tenant with CODEXSUN_FRAPPE_LIVE_TENANT."
    );
    const source = getTenantDatabase(tenant);
    const access = new FrappeConnectionAccess(
      source as unknown as Kysely<FrappeDatabase>,
      env.JWT_SECRET,
      { baseUrl: "", apiKey: "", apiSecret: "", enabled: false }
    );
    const settings = await access.exportCredentials();
    assert.ok(
      settings,
      "Live test blocked: save, enable, and verify the tenant's Frappe connection in the app first. Do not put API secrets in test files."
    );
    assert.ok(
      !/\.test$|\.invalid$/.test(new URL(settings.baseUrl).hostname),
      "Live tests require a real Frappe host."
    );
    assert.equal(
      new URL(settings.baseUrl).hostname,
      process.env.CODEXSUN_FRAPPE_LIVE_HOST || "logicx.tmnext.in",
      "The saved connection must target the explicitly selected live host."
    );
    await requestFrappe("/api/method/frappe.auth.get_logged_user", "GET", settings);
    for (const name of ["SOP Item", "SOP Assigned", "SOP Reporting"]) {
      const meta: { data: { fields: Field[] } } = await requestFrappe<{
        data: { fields: Field[] };
      }>(`/api/resource/DocType/${encodeURIComponent(name)}`, "GET", settings);
      for (const field of fixture.doctypes[name].fields as Field[]) {
        const actual: Field | undefined = meta.data.fields.find(
          (value: Field) => value.fieldname === field.fieldname
        );
        assert.ok(actual, `Missing live field ${name}.${field.fieldname}`);
        assert.equal(actual.fieldtype, field.fieldtype, `${name}.${field.fieldname} type changed`);
        if (["Link", "Select"].includes(field.fieldtype))
          assert.equal(actual.options, field.options, `${name}.${field.fieldname} options changed`);
      }
    }
    const mappingDb = source as unknown as Kysely<FrappeUserMappingDatabase>;
    const users = await sql<{
      email: string;
    }>`SELECT DISTINCT u.email FROM app_users u JOIN frappe_user_mappings m ON m.local_user_id=u.id WHERE u.status='active' AND m.employee_code IS NOT NULL`.execute(
      source
    );
    let actor: { email: string; employee: string } | undefined;
    for (const user of users.rows) {
      const employee = await mappedEmployeeCodeForLocalUser(
        mappingDb,
        user.email,
        settings.baseUrl
      );
      if (employee) {
        actor = { email: user.email, employee };
        break;
      }
    }
    assert.ok(
      actor,
      "Map an active local user to a live Frappe Employee on this connection before testing."
    );
    const activeActor = actor;
    const person = await requestFrappe<{ data: { status: string; department: string } }>(
      `/api/resource/Employee/${encodeURIComponent(activeActor.employee)}`,
      "GET",
      settings
    );
    assert.equal(person.data.status, "Active", "The mapped Employee must be active.");
    let departmentName = person.data.department;
    if (!departmentName) {
      // SOP departments are independent of an Employee's optional HR department.
      const query = new URLSearchParams({
        fields: JSON.stringify(["name"]),
        filters: JSON.stringify([["disabled", "=", 0]]),
        order_by: "name asc",
        limit_page_length: "1"
      });
      const options = await requestFrappe<{ data: Array<{ name: string }> }>(
        `/api/resource/Department?${query}`,
        "GET",
        settings
      );
      assert.ok(options.data[0], "Create an active Department before testing SOP delivery.");
      departmentName = options.data[0].name;
    }
    const department = await resolveDutyDepartment(departmentName, settings);
    const name = `codexsun_crm_live_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const admin = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });
    const database = new Kysely<DutyReportDatabase>({
      dialect: new MysqlDialect({
        pool: createPool({
          database: name,
          host: env.DB_HOST,
          port: env.DB_PORT,
          user: env.DB_USER,
          password: env.DB_PASSWORD,
          timezone: "Z"
        })
      })
    });
    const app = Fastify({ logger: false });
    suite.after(async () => {
      await app.close();
      await database.destroy();
      assert.match(name, /^codexsun_crm_live_e2e_[a-f0-9]{16}$/);
      try {
        await admin.query(`DROP DATABASE \`${name}\``);
      } finally {
        await admin.end();
      }
    });
    await admin.query(
      `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await migrateTenantUserModule(database as never);
    for (const migrate of [
      migrateSopModule,
      migrateSopItemModule,
      migrateDutyAssignmentModule,
      migrateDutyReportModule,
      migrateFrappeSyncModule
    ])
      await migrate(database as never);
    await sql`INSERT INTO app_users (uuid,name,email,password_hash) VALUES ('c0decafe','Live sync fixture',${activeActor.email},'test-only-no-login')`.execute(
      database
    );
    const localUser = await database.selectFrom("app_users").select("id").executeTakeFirstOrThrow();
    const scope = async () => ({
      database,
      actorEmail: activeActor.email,
      actorUserId: localUser.id,
      authorize: async () => {}
    });
    await sopModule.register(app, scope as never);
    await sopItemModule.register(app, scope as never);
    await dutyAssignmentModule.register(app, scope as never);
    await dutyReportModule.register(app, scope as never);
    const marker = `CODEXSUN LIVE TEST ${randomUUID().slice(0, 8)}`;
    const sop = await post(app, "/crm/sops", {
      code: marker,
      title: marker,
      purpose: "Live sync verification fixture"
    });
    const employeeLookup = (email: string, baseUrl: string) =>
      mappedEmployeeCodeForLocalUser(mappingDb, email, baseUrl);
    const frequencies = [
      ["daily", "Daily"],
      ["weekly", "Weekly"],
      ["monthly", "Monthly"],
      ["annually", "Yearly"]
    ] as const;
    for (const [frequency, remoteFrequency] of frequencies) {
      const created: Array<{ doctype: string; name: string }> = [];
      try {
        const title = frequency === "daily" ? marker : `${frequency} inspection`;
        const item = await post(app, "/crm/sop-items", {
          sopId: sop.id,
          code: frequency,
          title,
          department,
          frequency,
          sortOrder: 1,
          revision: { instructions: "Inspect the counter.", evidenceGuidance: "Record shortages." }
        });
        await post(app, `/crm/sop-items/${item.id}/revisions/${item.currentRevision.id}/publish`);
        const remoteItem = await deliver("sop-item", item.id, "SOP Item");
        assert.equal(remoteItem.sop_name, frequency === "daily" ? marker : `${marker}: ${title}`);
        assert.equal(remoteItem.department, department);
        assert.equal(remoteItem.frequency, remoteFrequency);
        assert.match(remoteItem.steps, /Inspect the counter\./);
        assert.match(remoteItem.steps, /Record shortages\./);
        const date = new Date().toISOString().slice(0, 10);
        const assignment = await post(app, "/crm/duty-assignments", {
          sopItemId: item.id,
          revisionId: item.currentRevision.id,
          assigneeUserId: localUser.id,
          displayOrder: 7,
          startDate: date,
          endDate: null
        });
        const remoteAssignment = await deliver("duty-assignment", assignment.id, "SOP Assigned");
        assert.equal(remoteAssignment.sop_item, remoteItem.name);
        assert.equal(remoteAssignment.user, activeActor.employee);
        assert.equal(Number(remoteAssignment.index), 7);
        for (const key of ["sop_name", "department", "frequency", "steps"])
          assert.equal(remoteAssignment[key], remoteItem[key], `Assigned.${key}`);
        const editedAssignment = await put(app, `/crm/duty-assignments/${assignment.id}`, {
          sopItemId: item.id,
          revisionId: item.currentRevision.id,
          assigneeUserId: localUser.id,
          displayOrder: 8,
          startDate: date,
          endDate: null
        });
        assert.equal(editedAssignment.id, assignment.id);
        const updatedAssignment = await deliver(
          "duty-assignment",
          assignment.id,
          "SOP Assigned",
          false
        );
        assert.equal(updatedAssignment.name, remoteAssignment.name);
        assert.equal(Number(updatedAssignment.index), 8);
        for (const key of ["sop_item", "user", "sop_name", "department", "frequency", "steps"])
          assert.equal(updatedAssignment[key], remoteAssignment[key], `Edited Assigned.${key}`);
        const blocked = frequency === "weekly";
        const report = await post(app, "/crm/duty-reports", {
          assignmentId: assignment.id,
          performedDate: date,
          actions: "Live verification completed.",
          result: blocked ? "blocked" : "completed",
          issueDetails: blocked ? "Test issue: no <parts>." : ""
        });
        const remoteReport = await deliver("duty-report", report.id, "SOP Reporting");
        assert.equal(remoteReport.sop_item, remoteItem.name);
        assert.equal(remoteReport.user, activeActor.employee);
        assert.equal(remoteReport.date, date);
        assert.match(remoteReport.actions, /Live verification completed\./);
        assert.match(
          remoteReport.actions,
          new RegExp(`Result: ${blocked ? "blocked" : "completed"}`)
        );
        assert.match(remoteReport.actions, /Inspect the counter\./);
        assert.match(remoteReport.actions, /Record shortages\./);
        assert.match(remoteReport.actions, new RegExp(`CRM revision: ${item.currentRevision.id}`));
        if (blocked) assert.match(remoteReport.actions, /no &lt;parts&gt;/);
        for (const key of ["sop_name", "department", "frequency", "steps"])
          assert.equal(remoteReport[key], remoteItem[key], `Reporting.${key}`);
        const editedDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const edited = await put(app, `/crm/duty-reports/${report.id}`, {
          performedDate: editedDate,
          actions: "Live verification corrected: delivery acknowledged."
        });
        assert.equal(edited.id, report.id);
        assert.equal(edited.assignmentId, assignment.id);
        assert.equal(edited.revisionId, report.revisionId);
        assert.equal(edited.result, report.result);
        assert.equal(edited.issueDetails, report.issueDetails);
        const updatedReport = await deliver("duty-report", report.id, "SOP Reporting", false);
        assert.equal(
          updatedReport.name,
          remoteReport.name,
          "Edit must PUT the existing remote report"
        );
        assert.equal(updatedReport.date, editedDate);
        assert.match(updatedReport.actions, /Live verification corrected: delivery acknowledged\./);
        assert.doesNotMatch(updatedReport.actions, /Live verification completed\./);
        assert.match(
          updatedReport.actions,
          new RegExp(`Result: ${blocked ? "blocked" : "completed"}`)
        );
        assert.match(updatedReport.actions, /Inspect the counter\./);
        assert.match(updatedReport.actions, /Record shortages\./);
        assert.match(updatedReport.actions, new RegExp(`CRM revision: ${report.revisionId}`));
        if (blocked) assert.match(updatedReport.actions, /no &lt;parts&gt;/);
        for (const key of ["sop_item", "user", "sop_name", "department", "frequency", "steps"])
          assert.equal(updatedReport[key], remoteReport[key], `Edited Reporting.${key}`);
        const history = await database
          .selectFrom("crm_duty_report_edits")
          .select(["changed_by", "before_data"])
          .where("report_id", "=", report.id)
          .execute();
        assert.equal(history.length, 1);
        assert.equal(history[0]!.changed_by, activeActor.email);
        const prior =
          typeof history[0]!.before_data === "string"
            ? JSON.parse(history[0]!.before_data)
            : history[0]!.before_data;
        assert.equal(prior.actions, "Live verification completed.");
        const reportListQuery = new URLSearchParams({
          fields: JSON.stringify(["name"]),
          filters: JSON.stringify([["sop_item", "=", remoteItem.name]]),
          limit_page_length: "10"
        });
        const remoteReports = await requestFrappe<{ data: Array<{ name: string }> }>(
          `/api/resource/SOP%20Reporting?${reportListQuery}`,
          "GET",
          settings
        );
        assert.equal(
          remoteReports.data.length,
          1,
          "Edits must not create duplicate remote reports"
        );
        await enqueueCrmFrappeSync(database as never, "duty-report", report.id, activeActor.email);
        const retry = await deliver("duty-report", report.id, "SOP Reporting", false);
        assert.equal(retry.name, remoteReport.name, "Retry must preserve remote report identity");
        console.log(
          `Verified live ${remoteFrequency}: SOP Item, duty create/edit and report create/edit; all mapped/fetched fields and stable remote identities.`
        );
      } finally {
        await cleanupLiveRecords(created, settings);
      }
      async function deliver(
        type: "sop-item" | "duty-assignment" | "duty-report",
        id: number,
        doctype: string,
        remember = true
      ) {
        const event = await database
          .selectFrom("crm_frappe_sync_queue")
          .select("id")
          .where("entity_type", "=", type)
          .where("local_record_id", "=", id)
          .executeTakeFirstOrThrow();
        try {
          const result = await processCrmDutySync(
            database as never,
            event.id,
            settings!,
            employeeLookup
          );
          assert.equal(result.status, "synced");
          assert.ok("remoteName" in result);
          if (remember) created.push({ doctype, name: result.remoteName });
          const remote = await requestFrappe<{ data: RemoteDocument }>(
            `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(result.remoteName)}`,
            "GET",
            settings!
          );
          return remote.data;
        } catch (error) {
          console.error(`Live delivery failed for ${doctype}. Known test records:`, created);
          throw error;
        }
      }
    }
  }
);

async function post(app: ReturnType<typeof Fastify>, url: string, payload = {}) {
  const response = await app.inject({ method: "POST", url, payload });
  assert.equal(response.statusCode, 200, `${url}: ${response.body}`);
  return response.json().data;
}

async function put(app: ReturnType<typeof Fastify>, url: string, payload: Record<string, unknown>) {
  const response = await app.inject({ method: "PUT", url, payload });
  assert.equal(response.statusCode, 200, `${url}: ${response.body}`);
  return response.json().data;
}

async function cleanupLiveRecords(
  created: Array<{ doctype: string; name: string }>,
  settings: Parameters<typeof requestFrappe>[2]
) {
  // Only names created by this run are eligible for deletion, in child-first order.
  const failures: unknown[] = [];
  for (const record of created.reverse()) {
    try {
      await requestFrappe(
        `/api/resource/${encodeURIComponent(record.doctype)}/${encodeURIComponent(record.name)}`,
        "DELETE",
        settings,
        undefined,
        { allowExport: true }
      );
    } catch (error) {
      console.error("Live test record retained because cleanup failed:", record);
      failures.push(error);
    }
  }
  if (failures.length)
    throw new AggregateError(
      failures,
      "Live test cleanup was incomplete. Retained record names are listed above."
    );
}
