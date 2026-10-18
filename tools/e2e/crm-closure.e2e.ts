import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createConnection } from "mysql2/promise";
import {
  migrateCoreTenantDatabase,
  seedCoreTenantDatabase,
  runWithCoreDatabase,
  closeCoreDatabase
} from "../../apps/core/api/src/database/core-database.js";
import { migrateTenantRuntimeModule } from "../../apps/platform/api/src/modules/tenant/tenant.migration.js";
import { seedStatusMaster } from "../../apps/crm/api/src/modules/status/index.js";
import { seedPriorityMaster } from "../../apps/crm/api/src/modules/priority/index.js";
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

const databaseName = `codexsun_crm_closure_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
function openDatabase() {
  return new Kysely<ClosureDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: databaseName,
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
  const admin = await createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD
  });
  const database = openDatabase();
  const app = Fastify({ logger: false });
  const enquiryIds: number[] = [];
  suite.after(async () => {
    await app.close();
    await database.destroy();
    await closeCoreDatabase();
    assert.match(databaseName, /^codexsun_crm_closure_e2e_[a-f0-9]{16}$/);
    try {
      await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    } finally {
      await admin.end();
    }
  });
  await migrateCoreTenantDatabase(databaseName);
  await seedCoreTenantDatabase(databaseName);
  await migrateTenantRuntimeModule(database as never);
  await migrateCrmTenantDatabase(database);
  await seedStatusMaster(database as never);
  await seedPriorityMaster(database as never);
  await sql`INSERT INTO app_users (uuid,name,email,password_hash,status) VALUES ('testuser','Closure reviewer','closure@example.test','test-only','active')`.execute(
    database
  );
  await sql`INSERT INTO app_roles (uuid,\`key\`,label) VALUES ('testrole','admin','Admin')`.execute(
    database
  );
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
    actorEmail:
      request.headers["x-test-unassigned"] === "true" ? "other@example.test" : actor.email,
    actorUserId: request.headers["x-test-unassigned"] === "true" ? null : actor.id,
    canViewAll: false,
    canReview: request.headers["x-test-reviewer"] === "true"
  }));
  await enquiryModule.register(app, async () => ({
    database,
    actorEmail: actor.email,
    actorUserId: actor.id,
    canViewAll: true,
    pendingClosureLookup: async (ids: number[]) => {
      if (!ids.length) return new Set<number>();
      const rows = await database
        .selectFrom("crm_closure_requests")
        .select("enquiry_id")
        .where("status", "=", "pending")
        .where("enquiry_id", "in", ids)
        .execute();
      return new Set(rows.map((row) => row.enquiry_id));
    },
    listUsers: async () => [],
    relations: {
      contact: async (id: number) =>
        (await database
          .selectFrom("core_contacts")
          .select(["id", "name"])
          .where("id", "=", id)
          .executeTakeFirst()) ?? null,
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

  const customer = await runWithCoreDatabase(databaseName, async () => {
    const { ContactService } =
      await import("../../apps/core/api/src/modules/master/contact/contact.service.js");
    return new ContactService().resolveOrCreateCustomer("Closure linked customer", "9876543210");
  });
  async function makeEnquiry(title: string, statusId = newStatus.id) {
    const sourceReference = `closure-e2e-${Date.now()}-${Math.random()}`;
    const enquiryNo = Math.floor(1_000_000_000 + Math.random() * 1_000_000_000);
    const inserted = await database
      .insertInto("crm_enquiries")
      .values({
        enquiry_no: enquiryNo,
        title,
        description: title,
        contact_id: customer.id,
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

  async function assertPendingBadge(enquiryId: number, pending: boolean) {
    const page = await app.inject({ method: "GET", url: "/crm/enquiries?filter=all" });
    assert.equal(page.statusCode, 200, page.body);
    const row = page
      .json()
      .data.items.find((item: { id: string }) => Number(item.id) === enquiryId);
    assert.ok(row);
    assert.equal(row.closurePending, pending);
  }
  async function requestClosure(id: number, source = "mobile") {
    return app.inject({
      method: "POST",
      url: `/crm/enquiries/${id}/closure-requests`,
      payload: { note: `Work completed on ${source}.` }
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
  await assertPendingBadge(approvalEnquiryId, true);
  assert.equal(requested.json().data.contact, "Closure linked customer");
  const requestComments = await database
    .selectFrom("crm_enquiry_comments")
    .select("body")
    .where("enquiry_id", "=", approvalEnquiryId)
    .execute();
  assert.equal(
    requestComments.length,
    0,
    "Closure workflow notes belong in Actions, not Comments."
  );

  for (const canReview of [false, true]) {
    const latest = await app.inject({
      method: "GET",
      url: `/crm/enquiries/${approvalEnquiryId}/closure-requests/latest`,
      headers: { "x-test-reviewer": String(canReview) }
    });
    assert.equal(latest.statusCode, 200, latest.body);
    assert.equal(latest.json().data.canReview, canReview);
    assert.equal(latest.json().data.item.id, requestEnvelope.data.id);
  }
  const deniedReview = await app.inject({
    method: "PATCH",
    url: `/crm/closure-requests/${requestEnvelope.data.id}/review`,
    payload: { decision: "approve" }
  });
  assert.equal(deniedReview.statusCode, 403, deniedReview.body);
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

  await database
    .insertInto("crm_enquiry_jobs")
    .values({
      enquiry_id: approvalEnquiryId,
      employee: actor.email,
      start_at: sql`UTC_TIMESTAMP()`,
      stop_at: null,
      duration_seconds: 0,
      rate_per_hour: "0.00",
      total_cost: "0.00",
      status: "running",
      created_by: actor.email
    })
    .execute();
  const blockedByJob = await app.inject({
    method: "PATCH",
    url: `/crm/closure-requests/${requestEnvelope.data.id}/review`,
    headers: { "x-test-reviewer": "true" },
    payload: { decision: "approve" }
  });
  assert.equal(blockedByJob.statusCode, 409, blockedByJob.body);
  await database
    .updateTable("crm_enquiry_jobs")
    .set({ status: "completed", stop_at: sql`UTC_TIMESTAMP()` })
    .where("enquiry_id", "=", approvalEnquiryId)
    .execute();
  await database
    .insertInto("crm_work_reports")
    .values({
      enquiry_id: approvalEnquiryId,
      task_id: null,
      action: "check-in",
      body: "",
      request_id: `closure-check-in-${approvalEnquiryId}`,
      latitude: "1.2345678",
      longitude: "2.3456789",
      accuracy_meters: "5.00",
      captured_at: sql`UTC_TIMESTAMP()`,
      created_by: actor.email
    })
    .execute();
  const blockedByCheckIn = await app.inject({
    method: "PATCH",
    url: `/crm/closure-requests/${requestEnvelope.data.id}/review`,
    headers: { "x-test-reviewer": "true" },
    payload: { decision: "approve" }
  });
  assert.equal(blockedByCheckIn.statusCode, 409, blockedByCheckIn.body);
  await database
    .insertInto("crm_work_reports")
    .values({
      enquiry_id: approvalEnquiryId,
      task_id: null,
      action: "check-out",
      body: "",
      request_id: `closure-check-out-${approvalEnquiryId}`,
      latitude: "1.2345678",
      longitude: "2.3456789",
      accuracy_meters: "5.00",
      captured_at: sql`UTC_TIMESTAMP()`,
      created_by: actor.email
    })
    .execute();

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
  await assertPendingBadge(approvalEnquiryId, false);
  const reviewComments = await database
    .selectFrom("crm_enquiry_comments")
    .select("body")
    .where("enquiry_id", "=", approvalEnquiryId)
    .execute();
  assert.equal(reviewComments.length, 0);
  const closureEvents = await database
    .selectFrom("crm_enquiry_activity")
    .select("action")
    .where("enquiry_id", "=", approvalEnquiryId)
    .where("action", "=", "closure-approved")
    .execute();
  assert.equal(closureEvents.length, 1);

  const rejectionEnquiryId = await makeEnquiry("Closure rejection e2e");
  const rejectedRequest = await requestClosure(rejectionEnquiryId, "web");
  await assertPendingBadge(rejectionEnquiryId, true);
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
  await assertPendingBadge(rejectionEnquiryId, false);

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
  const statusComments = await database
    .selectFrom("crm_enquiry_comments")
    .select("body")
    .where("enquiry_id", "=", wonEnquiryId)
    .execute();
  assert.equal(statusComments.length, 0, "Status changes are Actions, not user comments.");
});
