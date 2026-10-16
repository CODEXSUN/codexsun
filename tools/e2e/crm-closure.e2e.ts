import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { env } from "../../apps/platform/api/src/env.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import {
  closureModule,
  enquiryModule,
  type ClosureDatabase
} from "../../apps/crm/api/src/index.js";
import { seedClosurePermissions } from "../../apps/crm/api/src/modules/closure/closure.seed.js";

assert.equal(env.NODE_ENV, "development", "This suite uses only the local development database.");
assert.notEqual(env.DEFAULT_TENANT_DB_NAME, env.DB_MASTER_NAME);

function openDatabase() {
  return new Kysely<ClosureDatabase>({
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
}

test("closure requests await web approval before changing enquiry status", async (suite) => {
  const database = openDatabase();
  const app = Fastify({ logger: false });
  const enquiryIds: number[] = [];
  suite.after(async () => {
    for (const enquiryId of enquiryIds) {
      await sql`DELETE FROM crm_closure_requests WHERE enquiry_id=${enquiryId}`.execute(database);
      await sql`DELETE FROM crm_enquiry_comments WHERE enquiry_id=${enquiryId}`.execute(database);
      await sql`DELETE FROM crm_enquiry_activity WHERE enquiry_id=${enquiryId}`.execute(database);
      await sql`DELETE FROM crm_enquiries WHERE id=${enquiryId}`.execute(database);
    }
    await app.close();
    await database.destroy();
  });

  await migrateCrmTenantDatabase(database);
  await seedClosurePermissions(database);
  const permission = await sql<{ count: number }>`SELECT COUNT(*) AS count
    FROM app_role_permissions grant_row
    INNER JOIN app_roles role ON role.id=grant_row.role_id
    INNER JOIN app_permissions permission ON permission.id=grant_row.permission_id
    WHERE role.\`key\`='admin' AND permission.\`key\`='crm.closure.review'
      AND grant_row.status='active' AND permission.status='active'`.execute(database);
  assert.ok(Number(permission.rows[0]?.count) > 0, "Admin needs closure review permission.");
  const actor = await database
    .selectFrom("app_users")
    .select(["id", "email"])
    .where("status", "=", "active")
    .executeTakeFirstOrThrow();
  const newStatus = await database
    .selectFrom("crm_enquiry_statuses")
    .select("id")
    .where("code", "=", "new")
    .executeTakeFirstOrThrow();
  const openStatus = await database
    .selectFrom("crm_enquiry_statuses")
    .select("id")
    .where("code", "=", "open")
    .executeTakeFirstOrThrow();
  const wonStatus = await database
    .selectFrom("crm_enquiry_statuses")
    .select("id")
    .where("code", "=", "won")
    .executeTakeFirstOrThrow();
  const priority = await database
    .selectFrom("crm_enquiry_priorities")
    .select("id")
    .where("code", "=", "normal")
    .executeTakeFirstOrThrow();

  await closureModule.register(app, async (request) => ({
    database,
    actorEmail: actor.email,
    actorUserId: request.headers["x-test-unassigned"] === "true" ? null : actor.id,
    canViewAll: false,
    canReview: request.headers["x-test-reviewer"] === "true"
  }));
  await enquiryModule.register(app, async () => ({
    database,
    actorEmail: actor.email,
    actorUserId: actor.id,
    canViewAll: true,
    listUsers: async () => [],
    relations: {
      contact: async () => null,
      resolveOrCreateCustomer: async () => ({ id: 1, name: "Closure test" }),
      user: async () => ({ name: "Test user" }),
      listIn: async () => ({ name: "Test list" }),
      status: async (id) => {
        const row = await database
          .selectFrom("crm_enquiry_statuses")
          .select(["name", "code"])
          .where("id", "=", id)
          .where("status", "=", "active")
          .executeTakeFirst();
        return row ?? null;
      },
      priority: async () => ({ name: "Normal" })
    }
  }));
  await app.ready();

  async function makeEnquiry(title: string, statusId = newStatus.id) {
    const sourceReference = `closure-e2e-${Date.now()}-${Math.random()}`;
    const enquiryNo = Math.floor(1_000_000_000 + Math.random() * 1_000_000_000);
    const inserted = await database
      .insertInto("crm_enquiries")
      .values({
        enquiry_no: enquiryNo,
        title,
        description: title,
        contact_id: null,
        captured_name: "Closure test",
        captured_email: null,
        captured_phone: null,
        source: "test",
        source_reference: sourceReference,
        list_in_id: null,
        status_id: statusId,
        priority_id: priority.id,
        assigned_user_id: actor.id,
        enquired_at: sql`UTC_TIMESTAMP()`,
        due_date: null,
        closed_reason: null,
        created_by: actor.email,
        created_at: sql`UTC_TIMESTAMP()`,
        updated_at: sql`UTC_TIMESTAMP()`
      })
      .executeTakeFirstOrThrow();
    const id = Number(inserted.insertId);
    enquiryIds.push(id);
    return id;
  }

  async function requestClosure(id: number) {
    return app.inject({
      method: "POST",
      url: `/crm/enquiries/${id}/closure-requests`,
      payload: { note: "Work completed on mobile." }
    });
  }

  const approvalEnquiryId = await makeEnquiry("Closure approval e2e");
  const deniedRequest = await app.inject({
    method: "POST",
    url: `/crm/enquiries/${approvalEnquiryId}/closure-requests`,
    headers: { "x-test-unassigned": "true" },
    payload: { note: "Should be denied." }
  });
  assert.equal(deniedRequest.statusCode, 403, deniedRequest.body);
  const requested = await requestClosure(approvalEnquiryId);
  assert.equal(requested.statusCode, 200, requested.body);
  const requestEnvelope = requested.json() as { data: { id: number; status: string } };
  assert.equal(requestEnvelope.data.status, "pending");
  const requestComment = await database
    .selectFrom("crm_enquiry_comments")
    .select("body")
    .where("enquiry_id", "=", approvalEnquiryId)
    .executeTakeFirstOrThrow();
  assert.match(requestComment.body, /Closure requested from mobile/);

  const deniedQueue = await app.inject({ method: "GET", url: "/crm/closure-requests" });
  assert.equal(deniedQueue.statusCode, 403, deniedQueue.body);

  const stillOpen = await database
    .selectFrom("crm_enquiries")
    .innerJoin("crm_enquiry_statuses", "crm_enquiry_statuses.id", "crm_enquiries.status_id")
    .select("crm_enquiry_statuses.code as code")
    .where("crm_enquiries.id", "=", approvalEnquiryId)
    .executeTakeFirstOrThrow();
  assert.equal(stillOpen.code, "new");

  const duplicate = await requestClosure(approvalEnquiryId);
  assert.equal(duplicate.statusCode, 409, duplicate.body);

  const pendingQueue = await app.inject({
    method: "GET",
    url: "/crm/closure-requests?status=pending",
    headers: { "x-test-reviewer": "true" }
  });
  assert.equal(pendingQueue.statusCode, 200, pendingQueue.body);
  assert.equal(
    (pendingQueue.json() as { data: { items: Array<{ id: number }> } }).data.items[0]?.id,
    requestEnvelope.data.id
  );

  const approved = await app.inject({
    method: "PATCH",
    url: `/crm/closure-requests/${requestEnvelope.data.id}/review`,
    headers: { "x-test-reviewer": "true" },
    payload: { decision: "approve", note: "Verified complete." }
  });
  assert.equal(approved.statusCode, 200, approved.body);
  assert.equal((approved.json() as { data: { status: string } }).data.status, "approved");
  const closed = await database
    .selectFrom("crm_enquiries")
    .innerJoin("crm_enquiry_statuses", "crm_enquiry_statuses.id", "crm_enquiries.status_id")
    .select("crm_enquiry_statuses.code as code")
    .where("crm_enquiries.id", "=", approvalEnquiryId)
    .executeTakeFirstOrThrow();
  assert.equal(closed.code, "closed");
  const reviewComment = await database
    .selectFrom("crm_enquiry_comments")
    .select("body")
    .where("enquiry_id", "=", approvalEnquiryId)
    .orderBy("id", "desc")
    .executeTakeFirstOrThrow();
  assert.match(reviewComment.body, /Closure verified and enquiry closed/);

  const rejectionEnquiryId = await makeEnquiry("Closure rejection e2e");
  const rejectedRequest = await requestClosure(rejectionEnquiryId);
  const rejectionId = (rejectedRequest.json() as { data: { id: number } }).data.id;
  const rejected = await app.inject({
    method: "PATCH",
    url: `/crm/closure-requests/${rejectionId}/review`,
    headers: { "x-test-reviewer": "true" },
    payload: { decision: "reject", note: "Please add the final report." }
  });
  assert.equal(rejected.statusCode, 200, rejected.body);
  const remainsOpen = await database
    .selectFrom("crm_enquiries")
    .innerJoin("crm_enquiry_statuses", "crm_enquiry_statuses.id", "crm_enquiries.status_id")
    .select("crm_enquiry_statuses.code as code")
    .where("crm_enquiries.id", "=", rejectionEnquiryId)
    .executeTakeFirstOrThrow();
  assert.equal(remainsOpen.code, "new");

  const wonEnquiryId = await makeEnquiry("Status change comment e2e", openStatus.id);
  const won = await app.inject({
    method: "PATCH",
    url: `/crm/enquiries/${wonEnquiryId}/properties`,
    payload: { statusId: String(wonStatus.id), closedReason: "Customer accepted" }
  });
  assert.equal(won.statusCode, 200, won.body);
  const statusActivity = await database
    .selectFrom("crm_enquiry_activity")
    .select(["action", "details"])
    .where("enquiry_id", "=", wonEnquiryId)
    .executeTakeFirstOrThrow();
  assert.equal(statusActivity.action, "status-changed");
  assert.match(statusActivity.details, /Open to Won/);
  const statusComment = await database
    .selectFrom("crm_enquiry_comments")
    .select("body")
    .where("enquiry_id", "=", wonEnquiryId)
    .executeTakeFirstOrThrow();
  assert.match(statusComment.body, /Open to Won/);
});
