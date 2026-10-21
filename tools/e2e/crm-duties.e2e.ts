import {
  migrateChatModule,
  writeWorkMessage,
  ChatRepository
} from "../../apps/chat/api/src/index.js";
import { deliverDutyUpdate } from "../../apps/crm/api/src/modules/duty-assignment/index.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import Fastify from "fastify";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { createConnection } from "mysql2/promise";
import { sql } from "kysely";
import { migrateTenantUserModule } from "../../apps/platform/api/src/modules/tenant-user/tenant-user.migration.js";
import { migrateSopModule } from "../../apps/crm/api/src/modules/sop/index.js";
import { migrateSopItemModule } from "../../apps/crm/api/src/modules/sop-item/index.js";
import { migrateDutyAssignmentModule } from "../../apps/crm/api/src/modules/duty-assignment/index.js";
import { migrateDutyReportModule } from "../../apps/crm/api/src/modules/duty-report/index.js";
import { migrateFrappeSyncModule } from "../../apps/crm/api/src/modules/frappe-sync/index.js";
import { env } from "../../apps/platform/api/src/env.js";
import { sopModule } from "../../apps/crm/api/src/modules/sop/index.js";
import { sopItemModule } from "../../apps/crm/api/src/modules/sop-item/index.js";
import { dutyAssignmentModule } from "../../apps/crm/api/src/modules/duty-assignment/index.js";
import {
  dutyReportModule,
  type DutyReportDatabase
} from "../../apps/crm/api/src/modules/duty-report/index.js";
import {
  crmDutySyncIdempotencyKey,
  enqueueCrmFrappeSync
} from "../../apps/crm/api/src/modules/frappe-sync/index.js";
import { processCrmDutySync } from "@codexsun/frappe-api";
import type { FrappeSettings } from "../../apps/frappe/api/src/modules/connection/index.js";

assert.equal(env.NODE_ENV, "development", "This suite uses only the local development database.");
assert.notEqual(env.DEFAULT_TENANT_DB_NAME, env.DB_MASTER_NAME);

const logicx = JSON.parse(
  readFileSync(
    new URL(
      "../../apps/frappe/api/src/modules/crm-duty-sync/fixtures/logicx-duty-contract.json",
      import.meta.url
    ),
    "utf8"
  )
);
const testDatabaseName = `codexsun_crm_duties_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
function openDatabase(name = testDatabaseName) {
  const pool = createPool({
    database: name,
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    timezone: "Z",
    connectionLimit: 2
  });
  pool.on("connection", (connection) => {
    connection.query("SET SESSION sql_mode = CONCAT(@@sql_mode, ',ONLY_FULL_GROUP_BY')");
  });
  return new Kysely<DutyReportDatabase>({ dialect: new MysqlDialect({ pool }) });
}

test("CRM SOP publishing, assignment, mobile reporting, and outbound queue persist locally", async (suite) => {
  const admin = await createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD
  });
  await admin.query(
    `CREATE DATABASE \`${testDatabaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  let database = openDatabase();
  suite.after(async () => {
    await database.destroy();
    assert.match(testDatabaseName, /^codexsun_crm_duties_e2e_[a-f0-9]{16}$/);
    await admin.query(`DROP DATABASE \`${testDatabaseName}\``);
    await admin.end();
  });
  const app = Fastify({ logger: false });
  suite.after(() => app.close());
  let sopId: number | null = null;
  let itemId: number | null = null;
  let assignmentId: number | null = null;
  let reportId: number | null = null;
  let actorUserId: number | null = null;
  let denyPermissions = false;
  let denyAllReports = false;
  let managerReportAccessOnly = false;
  await migrateTenantUserModule(database as never);
  await migrateChatModule(database as never);
  await migrateSopModule(database as never);
  await migrateSopItemModule(database as never);
  await migrateDutyAssignmentModule(database as never);
  await migrateDutyReportModule(database as never);
  await migrateFrappeSyncModule(database as never);
  await sql`INSERT INTO app_users (uuid,name,email,password_hash) VALUES ('c0decafe','Duty E2E','duty-e2e@local.invalid','test-only-no-login')`.execute(
    database
  );
  await sql`SET SESSION sql_mode = CONCAT(@@sql_mode, ',ONLY_FULL_GROUP_BY')`.execute(database);
  const actor = await database
    .selectFrom("app_users")
    .select(["id", "email"])
    .where("status", "=", "active")
    .executeTakeFirstOrThrow();
  actorUserId = actor.id;
  const scope = async () => ({
    database,
    actorEmail: actor.email,
    actorUserId,
    notifyWork: async (
      trx: import("kysely").Transaction<DutyReportDatabase>,
      assignmentId: number,
      body: string
    ) => {
      await deliverDutyUpdate(trx, assignmentId, actor.email, body, (message) =>
        writeWorkMessage(trx as never, { ...message, actorEmail: actor.email, companyId: 1 })
      );
    },
    authorize: async (permission: string) => {
      if (
        denyPermissions ||
        (permission === "crm.duty-report.view.all" && denyAllReports) ||
        (managerReportAccessOnly &&
          permission.startsWith("crm.duty-report.") &&
          permission.endsWith(".own"))
      )
        throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    }
  });
  await sopModule.register(app, scope as never);
  await sopItemModule.register(app, scope as never);
  await dutyAssignmentModule.register(app, scope as never);
  await dutyReportModule.register(app, scope as never);
  await app.ready();
  actorUserId = null;
  const missingActor = await app.inject({ method: "GET", url: "/crm/duty-reports?scope=own" });
  assert.equal(
    missingActor.statusCode,
    403,
    "own report access must fail closed without an active actor"
  );
  actorUserId = actor.id;
  denyAllReports = true;
  const deniedAll = await app.inject({ method: "GET", url: "/crm/duty-reports?scope=all" });
  assert.equal(deniedAll.statusCode, 403, "all report access must require its explicit permission");
  denyAllReports = false;
  denyPermissions = true;
  const deniedOwn = await app.inject({ method: "GET", url: "/crm/duty-reports?scope=own" });
  assert.equal(deniedOwn.statusCode, 403, "own report permission denial must be enforced");
  denyPermissions = false;

  const code = `E2E-${randomUUID().slice(0, 8)}`;
  const createdSop = await app.inject({
    method: "POST",
    url: "/crm/sops",
    payload: { code, title: "E2E daily inspection", purpose: "Verify local duty workflow." }
  });
  assert.equal(createdSop.statusCode, 200, createdSop.body);
  sopId = createdSop.json().data.id;
  const createdItem = await app.inject({
    method: "POST",
    url: "/crm/sop-items",
    payload: {
      sopId,
      code: "OPEN",
      title: "Opening check",
      department: "Stores",
      frequency: "daily",
      sortOrder: 1,
      revision: { instructions: "Check the counter.", evidenceGuidance: "Record any issue." }
    }
  });
  assert.equal(createdItem.statusCode, 200, createdItem.body);
  itemId = createdItem.json().data.id;
  const revisionId = createdItem.json().data.currentRevision.id;
  const published = await app.inject({
    method: "POST",
    url: `/crm/sop-items/${itemId}/revisions/${revisionId}/publish`
  });
  assert.equal(published.statusCode, 200, published.body);
  const renamedSop = await app.inject({
    method: "PUT",
    url: `/crm/sops/${sopId}`,
    payload: { code, title: "E2E daily inspection updated", purpose: "Verify local duty workflow." }
  });
  assert.equal(renamedSop.statusCode, 200, renamedSop.body);
  const today = new Date().toISOString().slice(0, 10);
  const assigned = await app.inject({
    method: "POST",
    url: "/crm/duty-assignments",
    payload: {
      sopItemId: itemId,
      revisionId,
      assigneeUserId: actor.id,
      displayOrder: 1,
      startDate: today,
      endDate: null
    }
  });
  assert.equal(assigned.statusCode, 200, assigned.body);
  assignmentId = assigned.json().data.id;
  assert.equal(assigned.json().data.startDate, today);
  const editedAssignment = await app.inject({
    method: "PUT",
    url: `/crm/duty-assignments/${assignmentId}`,
    payload: {
      sopItemId: itemId,
      revisionId,
      assigneeUserId: actor.id,
      displayOrder: 3,
      startDate: today,
      endDate: null
    }
  });
  assert.equal(editedAssignment.statusCode, 200, editedAssignment.body);
  assert.equal(editedAssignment.json().data.id, assignmentId);
  assert.equal(editedAssignment.json().data.displayOrder, 3);
  const changedFrequency = await app.inject({
    method: "PUT",
    url: `/crm/sop-items/${itemId}`,
    payload: {
      sopId,
      code: "OPEN",
      title: "Opening check",
      department: "Stores",
      frequency: "monthly",
      sortOrder: 1
    }
  });
  assert.equal(changedFrequency.statusCode, 409, changedFrequency.body);
  const myDuties = await app.inject({ method: "GET", url: "/crm/duties" });
  assert.equal(myDuties.statusCode, 200, myDuties.body);
  assert.ok(myDuties.json().data.some((duty: { id: number }) => duty.id === assignmentId));
  const submitted = await app.inject({
    method: "POST",
    url: "/crm/duty-reports",
    payload: {
      assignmentId,
      performedDate: today,
      actions: "Counter checked.",
      result: "completed",
      issueDetails: ""
    }
  });
  assert.equal(submitted.statusCode, 200, submitted.body);
  reportId = submitted.json().data.id;
  const conversations = await new ChatRepository().listChannels(
    {
      database: database as never,
      actorEmail: actor.email,
      companyId: 1,
      tenantDatabase: testDatabaseName,
      tenantId: "e2e",
      authorize: async () => {}
    },
    {}
  );
  assert.equal(
    conversations.length,
    1,
    "duty assignment and reporting share one participant conversation"
  );
  const conversation = await new ChatRepository().channelDetail(
    {
      database: database as never,
      actorEmail: actor.email,
      companyId: 1,
      tenantDatabase: testDatabaseName,
      tenantId: "e2e",
      authorize: async () => {}
    },
    conversations[0]!.uuid
  );
  assert.ok(conversation.messages.some((message) => message.body.includes("duty assigned")));
  assert.ok(conversation.messages.some((message) => message.body.includes("Report completed")));

  const protectedAssignment = await app.inject({
    method: "PUT",
    url: `/crm/duty-assignments/${assignmentId}`,
    payload: {
      sopItemId: itemId,
      revisionId,
      assigneeUserId: actor.id + 100,
      displayOrder: 3,
      startDate: today,
      endDate: null
    }
  });
  assert.equal(protectedAssignment.statusCode, 409, protectedAssignment.body);
  const reorderWithHistory = await app.inject({
    method: "PUT",
    url: `/crm/duty-assignments/${assignmentId}`,
    payload: {
      sopItemId: itemId,
      revisionId,
      assigneeUserId: actor.id,
      displayOrder: 4,
      startDate: today,
      endDate: null
    }
  });
  assert.equal(reorderWithHistory.statusCode, 200, reorderWithHistory.body);
  const invalidWindow = await app.inject({
    method: "PUT",
    url: `/crm/duty-assignments/${assignmentId}`,
    payload: {
      sopItemId: itemId,
      revisionId,
      assigneeUserId: actor.id,
      displayOrder: 4,
      startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      endDate: null
    }
  });
  assert.equal(invalidWindow.statusCode, 409, invalidWindow.body);
  actorUserId = actor.id + 100;
  const wrongActor = await app.inject({
    method: "POST",
    url: "/crm/duty-reports",
    payload: {
      assignmentId,
      performedDate: today,
      actions: "Not my duty",
      result: "completed",
      issueDetails: ""
    }
  });
  assert.equal(wrongActor.statusCode, 403, wrongActor.body);
  actorUserId = actor.id;
  const invalidBlocked = await app.inject({
    method: "POST",
    url: "/crm/duty-reports",
    payload: {
      assignmentId,
      performedDate: today,
      actions: "Inspection",
      result: "blocked",
      issueDetails: ""
    }
  });
  assert.equal(invalidBlocked.statusCode, 400, invalidBlocked.body);
  const retried = await app.inject({
    method: "POST",
    url: "/crm/duty-reports",
    payload: {
      assignmentId,
      performedDate: today,
      actions: "A retried payload.",
      result: "completed",
      issueDetails: ""
    }
  });
  assert.equal(retried.statusCode, 200, retried.body);
  assert.equal(retried.json().data.id, reportId, "same recurrence must return the existing report");
  assert.equal(retried.json().data.actions, "Counter checked.");
  const reportHistory = await app.inject({
    method: "GET",
    url: `/crm/duty-reports?scope=all&search=${encodeURIComponent("Counter checked")}&from=${today}&to=${today}&page=1&pageSize=1`
  });
  assert.equal(reportHistory.statusCode, 200, reportHistory.body);
  assert.equal(reportHistory.json().data.items.length, 1);
  assert.ok(reportHistory.json().data.total >= 1);
  assert.equal(reportHistory.json().data.summary.completed >= 1, true);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const blocked = await app.inject({
    method: "POST",
    url: "/crm/duty-reports",
    payload: {
      assignmentId,
      performedDate: tomorrow,
      actions: "Inspection attempted.",
      result: "blocked",
      issueDetails: "No <parts> available."
    }
  });
  assert.equal(blocked.statusCode, 200, blocked.body);
  const blockedId = blocked.json().data.id;
  const blockedQueue = await database
    .selectFrom("crm_frappe_sync_queue")
    .select("id")
    .where("entity_type", "=", "duty-report")
    .where("local_record_id", "=", blockedId)
    .executeTakeFirstOrThrow();
  const queueRows = await database
    .selectFrom("crm_frappe_sync_queue")
    .select(["entity_type", "local_record_id", "status"])
    .where("entity_type", "in", ["sop-item", "duty-assignment", "duty-report"])
    .execute();
  assert.ok(
    queueRows.some((row) => row.entity_type === "sop-item" && row.local_record_id === itemId)
  );
  assert.ok(
    queueRows.some(
      (row) => row.entity_type === "duty-assignment" && row.local_record_id === assignmentId
    )
  );
  assert.ok(
    queueRows.some((row) => row.entity_type === "duty-report" && row.local_record_id === reportId)
  );
  const dispatchRow = await database
    .selectFrom("crm_frappe_sync_queue")
    .select(["uuid", "attempts"])
    .where("entity_type", "=", "duty-report")
    .where("local_record_id", "=", reportId)
    .executeTakeFirstOrThrow();
  assert.equal(
    crmDutySyncIdempotencyKey("tenant-test", dispatchRow.uuid, dispatchRow.attempts),
    `crm-duty-sync:tenant-test:${dispatchRow.uuid}:${dispatchRow.attempts}`
  );

  const workerEvents = await database
    .selectFrom("crm_frappe_sync_queue")
    .select(["id", "entity_type"])
    .where("entity_type", "in", ["sop-item", "duty-assignment", "duty-report"])
    .where("local_record_id", "in", [itemId, assignmentId, reportId])
    .execute();
  const outbound: Array<{ url: string; method: string; body: Record<string, unknown> }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if ((init?.method ?? "GET") === "GET") {
      if (url.pathname === "/api/resource/Department")
        return Response.json({ data: [{ name: "Stores - LX" }] });
      if (url.pathname === "/api/resource/SOP%20Assigned") return Response.json({ data: [] });
      throw new Error(`Unexpected lookup ${url.pathname}`);
    }
    const doctype = decodeURIComponent(url.pathname.split("/").at(-1)!);
    const fields = logicx.doctypes[doctype].fields;
    const payload = JSON.parse(String(init?.body ?? "{}"));
    for (const key of Object.keys(payload))
      assert.ok(
        fields.some((field: { fieldname: string }) => field.fieldname === key),
        `Unknown ${doctype} field ${key}`
      );
    for (const field of fields) {
      if (field.reqd && !field.fetch_from)
        assert.ok(payload[field.fieldname] !== undefined, `Missing ${doctype}.${field.fieldname}`);
      if (field.fieldtype === "Select" && payload[field.fieldname] !== undefined)
        assert.ok(field.options.split("\n").includes(payload[field.fieldname]));
    }
    outbound.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: JSON.parse(String(init?.body ?? "{}"))
    });
    return new Response(JSON.stringify({ data: { name: `REMOTE-${outbound.length}` } }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  try {
    const settings: FrappeSettings = {
      baseUrl: "https://frappe.test",
      apiKey: "test-key",
      apiSecret: "test-secret",
      enabled: true
    };
    for (const entityType of ["sop-item", "duty-assignment", "duty-report"] as const) {
      const event = workerEvents.find((row) => row.entity_type === entityType);
      assert.ok(event, `missing ${entityType} queue event`);
      if (entityType === "duty-report") {
        const results = await Promise.all([
          processCrmDutySync(database as never, event.id, settings, async () => "HR-EMP-00001"),
          processCrmDutySync(database as never, event.id, settings, async () => "HR-EMP-00001")
        ]);
        assert.equal(
          results.filter((result) => result.status === "synced").length,
          1,
          "atomic queue claim allows one worker to send the event"
        );
        assert.equal(
          results.filter((result) => result.status === "skipped").length,
          1,
          "a concurrent worker skips an already claimed event"
        );
      } else
        await processCrmDutySync(database as never, event.id, settings, async () => "HR-EMP-00001");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.deepEqual(
    outbound.map((request) => new URL(request.url).pathname),
    ["/api/resource/SOP%20Item", "/api/resource/SOP%20Assigned", "/api/resource/SOP%20Reporting"]
  );
  assert.equal(outbound[0]?.body.frequency, "Daily");
  assert.equal(outbound[0]?.body.department, "Stores - LX");
  assert.equal(outbound[1]?.body.sop_item, "REMOTE-1");
  assert.equal(outbound[1]?.body.user, "HR-EMP-00001");
  assert.equal(
    outbound[0]?.body.sop_name,
    "E2E daily inspection updated: Opening check",
    "SOP title edits queue a fresh published item document"
  );
  assert.equal(outbound[2]?.body.sop_item, "REMOTE-1");
  const delivered = await database
    .selectFrom("crm_frappe_sync_queue")
    .select(["entity_type", "status", "remote_name"])
    .where("entity_type", "in", ["sop-item", "duty-assignment", "duty-report"])
    .where("local_record_id", "in", [itemId, assignmentId, reportId])
    .execute();
  assert.equal(delivered.filter((event) => event.status === "synced").length, 3);
  await database
    .updateTable("crm_frappe_sync_queue")
    .set({ status: "pending", attempts: 0, remote_name: null, last_error: null })
    .where("entity_type", "=", "duty-report")
    .where("local_record_id", "=", reportId)
    .execute();
  const retryEvent = workerEvents.find((row) => row.entity_type === "duty-report")!;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "temporary outage" }), {
        status: 503,
        headers: { "content-type": "application/json" }
      });
    await assert.rejects(
      processCrmDutySync(
        database as never,
        retryEvent.id,
        {
          baseUrl: "https://frappe.test",
          apiKey: "test-key",
          apiSecret: "test-secret",
          enabled: true
        },
        async () => "HR-EMP-00001"
      )
    );
    const retryState = await database
      .selectFrom("crm_frappe_sync_queue")
      .select(["status", "attempts"])
      .where("id", "=", retryEvent.id)
      .executeTakeFirstOrThrow();
    assert.equal(retryState.status, "pending");
    assert.equal(retryState.attempts, 1);
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: { name: "REMOTE-REPORT-RETRY" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    await processCrmDutySync(
      database as never,
      retryEvent.id,
      {
        baseUrl: "https://frappe.test",
        apiKey: "test-key",
        apiSecret: "test-secret",
        enabled: true
      },
      async () => "HR-EMP-00001"
    );
    const retryDelivered = await database
      .selectFrom("crm_frappe_sync_queue")
      .select(["status", "attempts"])
      .where("id", "=", retryEvent.id)
      .executeTakeFirstOrThrow();
    assert.equal(retryDelivered.status, "synced");
    assert.equal(retryDelivered.attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
  await database
    .updateTable("crm_frappe_sync_queue")
    .set({ status: "pending", attempts: 0, remote_name: null, last_error: null })
    .where("id", "=", retryEvent.id)
    .execute();
  let signalStarted!: () => void;
  let releaseFetch!: () => void;
  const fetchStarted = new Promise<void>((resolve) => {
    signalStarted = resolve;
  });
  const fetchGate = new Promise<void>((resolve) => {
    releaseFetch = resolve;
  });
  globalThis.fetch = async () => {
    signalStarted();
    await fetchGate;
    return new Response(JSON.stringify({ data: { name: "REMOTE-REPORT-RESYNC" } }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  try {
    const inFlight = processCrmDutySync(
      database as never,
      retryEvent.id,
      {
        baseUrl: "https://frappe.test",
        apiKey: "test-key",
        apiSecret: "test-secret",
        enabled: true
      },
      async () => "HR-EMP-00001"
    );
    await fetchStarted;
    await enqueueCrmFrappeSync(database as never, "duty-report", reportId, actor.email);
    releaseFetch();
    await inFlight;
    const resyncState = await database
      .selectFrom("crm_frappe_sync_queue")
      .select(["status", "remote_name"])
      .where("id", "=", retryEvent.id)
      .executeTakeFirstOrThrow();
    assert.equal(
      resyncState.status,
      "pending",
      "updates arriving during delivery are retained for a follow-up PUT"
    );
    globalThis.fetch = async (_input, init) =>
      new Response(JSON.stringify({ data: { name: "REMOTE-REPORT-RESYNC" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    await processCrmDutySync(
      database as never,
      retryEvent.id,
      {
        baseUrl: "https://frappe.test",
        apiKey: "test-key",
        apiSecret: "test-secret",
        enabled: true
      },
      async () => "HR-EMP-00001"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
  const settings = {
    baseUrl: "https://frappe.test",
    apiKey: "test-key",
    apiSecret: "test-secret",
    enabled: true
  };
  try {
    globalThis.fetch = async (_input, init) => {
      const payload = JSON.parse(String(init?.body ?? "{}"));
      assert.match(payload.actions, /Result: blocked/);
      assert.match(payload.actions, /No &lt;parts&gt; available/);
      return Response.json({ data: { name: "REMOTE-BLOCKED" } });
    };
    await processCrmDutySync(
      database as never,
      blockedQueue.id,
      settings,
      async () => "HR-EMP-00001"
    );
    const itemEvent = workerEvents.find((row) => row.entity_type === "sop-item")!;
    await enqueueCrmFrappeSync(database as never, "sop-item", itemId!, actor.email);
    let writes = 0;
    globalThis.fetch = async (_input, init) => {
      if (init?.method !== "GET") writes++;
      return Response.json({ data: [] });
    };
    await assert.rejects(
      processCrmDutySync(database as never, itemEvent.id, settings, async () => "HR-EMP-00001"),
      /Department/
    );
    assert.equal(writes, 0, "unmapped Department must not send a document");
    const missingDepartmentState = await database
      .selectFrom("crm_frappe_sync_queue")
      .select(["status", "last_error"])
      .where("id", "=", itemEvent.id)
      .executeTakeFirstOrThrow();
    assert.equal(missingDepartmentState.status, "pending");
    assert.match(missingDepartmentState.last_error!, /Department/);
    globalThis.fetch = async (_input, init) =>
      init?.method === "GET"
        ? Response.json({ data: [{ name: "Stores - LX" }] })
        : Response.json({ data: { name: "REMOTE-1" } });
    await processCrmDutySync(database as never, itemEvent.id, settings, async () => "HR-EMP-00001");
    const secondAssignment = await app.inject({
      method: "POST",
      url: "/crm/duty-assignments",
      payload: {
        sopItemId: itemId,
        revisionId,
        assigneeUserId: actor.id,
        displayOrder: 2,
        startDate: today,
        endDate: null
      }
    });
    assert.equal(secondAssignment.statusCode, 409, secondAssignment.body);
    // Legacy duplicate assignments can still exist and must reuse the remote pair.
    const legacy = await database
      .insertInto("crm_duty_assignments")
      .values({
        uuid: randomUUID(),
        sop_item_id: itemId!,
        revision_id: revisionId,
        assignee_user_id: actor.id,
        display_order: 2,
        start_date: today,
        end_date: null,
        status: "active",
        assigned_by: actor.email
      })
      .executeTakeFirstOrThrow();
    const legacyAssignmentId = Number(legacy.insertId);
    await enqueueCrmFrappeSync(
      database as never,
      "duty-assignment",
      legacyAssignmentId,
      actor.email
    );
    const secondEvent = await database
      .selectFrom("crm_frappe_sync_queue")
      .select("id")
      .where("entity_type", "=", "duty-assignment")
      .where("local_record_id", "=", legacyAssignmentId)
      .executeTakeFirstOrThrow();
    globalThis.fetch = async (input, init) => {
      if (init?.method === "GET") return Response.json({ data: [{ name: "EXISTING-ASSIGNMENT" }] });
      assert.equal(init?.method, "PUT", "existing item/Employee pair must be reused");
      assert.match(String(input), /EXISTING-ASSIGNMENT$/);
      return Response.json({ data: { name: "EXISTING-ASSIGNMENT" } });
    };
    await processCrmDutySync(
      database as never,
      secondEvent.id,
      settings,
      async () => "HR-EMP-00001"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
  try {
    await enqueueCrmFrappeSync(database as never, "duty-report", reportId!, actor.email);
    let outboundCalls = 0;
    globalThis.fetch = async () => {
      outboundCalls++;
      throw new Error("No request without Employee mapping");
    };
    await assert.rejects(
      processCrmDutySync(database as never, retryEvent.id, settings, async () => null),
      /Employee mapping/
    );
    assert.equal(outboundCalls, 0);
    globalThis.fetch = async (_input, init) => {
      assert.equal(init?.method, "PUT");
      return Response.json({ data: { name: "REMOTE-REPORT-RESYNC" } });
    };
    await processCrmDutySync(
      database as never,
      retryEvent.id,
      settings,
      async () => "HR-EMP-00001"
    );
    await database
      .updateTable("crm_frappe_sync_queue")
      .set({ status: "pending", attempts: 4 })
      .where("id", "=", blockedQueue.id)
      .execute();
    globalThis.fetch = async () => Response.json({}, { status: 503 });
    await assert.rejects(
      processCrmDutySync(database as never, blockedQueue.id, settings, async () => "HR-EMP-00001")
    );
    const exhausted = await database
      .selectFrom("crm_frappe_sync_queue")
      .select(["status", "attempts"])
      .where("id", "=", blockedQueue.id)
      .executeTakeFirstOrThrow();
    assert.equal(exhausted.status, "failed");
    assert.equal(exhausted.attempts, 5);
    assert.equal(
      (
        await processCrmDutySync(
          database as never,
          blockedQueue.id,
          settings,
          async () => "HR-EMP-00001"
        )
      ).status,
      "skipped"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
  for (const frequency of ["quarterly", "once"]) {
    const unsupported = await app.inject({
      method: "POST",
      url: "/crm/sop-items",
      payload: {
        sopId,
        code: frequency,
        title: frequency,
        department: "Stores",
        frequency,
        sortOrder: 2,
        revision: { instructions: "Local only recurrence", evidenceGuidance: "" }
      }
    });
    assert.equal(unsupported.statusCode, 200, unsupported.body);
    const item = unsupported.json().data;
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `/crm/sop-items/${item.id}/revisions/${item.currentRevision.id}/publish`
        })
      ).statusCode,
      200
    );
    const event = await database
      .selectFrom("crm_frappe_sync_queue")
      .select("id")
      .where("entity_type", "=", "sop-item")
      .where("local_record_id", "=", item.id)
      .executeTakeFirstOrThrow();
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      throw new Error("No network expected for unsupported recurrence");
    };
    try {
      await assert.rejects(
        processCrmDutySync(database as never, event.id, settings, async () => "HR-EMP-00001"),
        /does not support/
      );
      assert.equal(calls, 0);
      const state = await database
        .selectFrom("crm_frappe_sync_queue")
        .select(["status", "last_error"])
        .where("id", "=", event.id)
        .executeTakeFirstOrThrow();
      assert.equal(state.status, "pending");
      assert.match(state.last_error!, /does not support/);
      assert.ok(
        await database
          .selectFrom("crm_sop_items")
          .select("id")
          .where("id", "=", item.id)
          .executeTakeFirst(),
        "local save survives unsupported remote contract"
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
  const otherName = `codexsun_crm_duties_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
  await admin.query(
    `CREATE DATABASE \`${otherName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  const other = openDatabase(otherName);
  const otherApp = Fastify({ logger: false });
  try {
    await migrateTenantUserModule(other as never);
    await migrateSopModule(other as never);
    await migrateSopItemModule(other as never);
    await migrateDutyAssignmentModule(other as never);
    await migrateDutyReportModule(other as never);
    await migrateFrappeSyncModule(other as never);
    await sql`INSERT INTO app_users (uuid,name,email,password_hash) VALUES ('c0decafe','Other tenant','duty-e2e@local.invalid','test-only-no-login')`.execute(
      other
    );
    await dutyReportModule.register(otherApp, async () => ({
      database: other,
      actorEmail: actor.email,
      actorUserId: actor.id,
      authorize: async () => {}
    }));
    const history = await otherApp.inject({ method: "GET", url: "/crm/duty-reports?scope=own" });
    assert.equal(history.statusCode, 200, history.body);
    assert.equal(
      history.json().data.total,
      0,
      "identical user identities in another tenant cannot see first tenant reports"
    );
    const emptySummary = await otherApp.inject({
      method: "GET",
      url: "/crm/duty-reports/summary?view=user"
    });
    assert.equal(emptySummary.statusCode, 200, emptySummary.body);
    assert.deepEqual(emptySummary.json().data, [], "report summary cannot cross tenant databases");
    const crossTenant = await otherApp.inject({
      method: "POST",
      url: "/crm/duty-reports",
      payload: {
        assignmentId,
        performedDate: today,
        actions: "Cross tenant attempt",
        result: "completed",
        issueDetails: ""
      }
    });
    assert.equal(crossTenant.statusCode, 404, crossTenant.body);
  } finally {
    await otherApp.close();
    await other.destroy();
    assert.match(otherName, /^codexsun_crm_duties_e2e_[a-f0-9]{16}$/);
    await admin.query(`DROP DATABASE \`${otherName}\``);
  }
  await sql`INSERT INTO app_users (uuid,name,email,password_hash) VALUES ('othermgr','Other reporter','other-report@local.invalid','test-only')`.execute(
    database
  );
  const otherReporter = await database
    .selectFrom("app_users")
    .select("id")
    .where("email", "=", "other-report@local.invalid")
    .executeTakeFirstOrThrow();
  const otherDuty = await app.inject({
    method: "POST",
    url: "/crm/duty-assignments",
    payload: {
      sopItemId: itemId,
      revisionId,
      assigneeUserId: otherReporter.id,
      displayOrder: 5,
      startDate: today,
      endDate: null
    }
  });
  assert.equal(otherDuty.statusCode, 200, otherDuty.body);
  actorUserId = otherReporter.id;
  const otherReport = await app.inject({
    method: "POST",
    url: "/crm/duty-reports",
    payload: {
      assignmentId: otherDuty.json().data.id,
      performedDate: today,
      actions: "Other reporter completed work.",
      result: "completed",
      issueDetails: ""
    }
  });
  assert.equal(otherReport.statusCode, 200, otherReport.body);
  actorUserId = actor.id;
  const allReports = await app.inject({ method: "GET", url: "/crm/duty-reports?scope=all" });
  assert.equal(allReports.json().data.total, 3);
  const ownReports = await app.inject({ method: "GET", url: "/crm/duty-reports?scope=own" });
  assert.equal(ownReports.json().data.total, 2, "mobile own scope remains restricted");
  for (const view of ["sop", "user", "department", "frequency"]) {
    const summary = await app.inject({
      method: "GET",
      url: `/crm/duty-reports/summary?view=${view}`
    });
    assert.equal(summary.statusCode, 200, summary.body);
    assert.equal(
      summary.json().data.reduce((sum: number, row: { total: number }) => sum + row.total, 0),
      3,
      view
    );
  }
  const sopSummary = await app.inject({ method: "GET", url: "/crm/duty-reports/summary?view=sop" });
  assert.equal(sopSummary.json().data[0].completed, 2);
  assert.equal(sopSummary.json().data[0].blocked, 1);
  const userDrilldown = await app.inject({
    method: "GET",
    url: `/crm/duty-reports?scope=all&assigneeId=${otherReporter.id}`
  });
  assert.equal(userDrilldown.json().data.total, 1);
  const blockedDrilldown = await app.inject({
    method: "GET",
    url: `/crm/duty-reports?scope=all&sopItemId=${itemId}&department=Stores&frequency=daily&result=blocked`
  });
  assert.equal(blockedDrilldown.json().data.total, 1);
  const dateSummary = await app.inject({
    method: "GET",
    url: `/crm/duty-reports/summary?view=sop&from=${today}&to=${today}`
  });
  assert.equal(dateSummary.json().data[0].total, 2);
  const searchedSummary = await app.inject({
    method: "GET",
    url: "/crm/duty-reports/summary?view=user&search=Other%20reporter"
  });
  assert.equal(searchedSummary.json().data[0].total, 1);
  denyAllReports = true;
  assert.equal(
    (await app.inject({ method: "GET", url: "/crm/duty-reports/summary" })).statusCode,
    403
  );
  const ownReportOptions = await app.inject({ method: "GET", url: "/crm/duty-reports/options" });
  assert.equal(ownReportOptions.statusCode, 200, ownReportOptions.body);
  assert.equal(ownReportOptions.json().data.canViewAll, false);
  assert.equal(
    (await app.inject({ method: "GET", url: "/crm/duty-reports?scope=all" })).statusCode,
    403,
    "capability introspection does not grant team-wide report data"
  );
  assert.equal(
    (await app.inject({ method: "GET", url: "/crm/duty-reports?scope=own" })).statusCode,
    200,
    "mobile own API remains available"
  );
  denyAllReports = false;
  managerReportAccessOnly = true;
  const managerOptions = await app.inject({ method: "GET", url: "/crm/duty-reports/options" });
  assert.equal(managerOptions.statusCode, 200, managerOptions.body);
  assert.equal(managerOptions.json().data.canViewAll, true);
  assert.equal(managerOptions.json().data.canCreate, false);
  assert.equal(
    (await app.inject({ method: "GET", url: "/crm/duty-reports/summary" })).statusCode,
    200
  );
  assert.equal(
    (await app.inject({ method: "GET", url: "/crm/duty-reports?scope=all" })).json().data.total,
    3
  );
  assert.equal(
    (await app.inject({ method: "GET", url: "/crm/duty-reports?scope=own" })).statusCode,
    403
  );
  managerReportAccessOnly = false;
  const dutyEditPayload = {
    sopItemId: itemId,
    revisionId,
    assigneeUserId: actor.id,
    displayOrder: 9,
    startDate: today,
    endDate: null
  };
  const editedDuty = await app.inject({
    method: "PUT",
    url: `/crm/duty-assignments/${assignmentId}`,
    payload: dutyEditPayload
  });
  assert.equal(editedDuty.statusCode, 409, "legacy duplicate pairs prevent edits until resolved");
  const ownOptions = await app.inject({ method: "GET", url: "/crm/duty-reports/options" });
  assert.equal(ownOptions.statusCode, 200, ownOptions.body);
  assert.equal(ownOptions.json().data.actorUserId, actor.id);
  const reportEdit = await app.inject({
    method: "PUT",
    url: `/crm/duty-reports/${reportId}`,
    payload: { performedDate: today, actions: "Corrected counter check." }
  });
  assert.equal(reportEdit.statusCode, 200, reportEdit.body);
  assert.equal(reportEdit.json().data.actions, "Corrected counter check.");
  const editHistory = await database
    .selectFrom("crm_duty_report_edits")
    .selectAll()
    .where("report_id", "=", reportId!)
    .execute();
  assert.equal(editHistory.length, 1);
  const before =
    typeof editHistory[0]!.before_data === "string"
      ? JSON.parse(editHistory[0]!.before_data)
      : editHistory[0]!.before_data;
  assert.equal(before.actions, "Counter checked.");
  assert.equal(editHistory[0]!.changed_by, actor.email);
  assert.equal(reportEdit.json().data.revisionId, submitted.json().data.revisionId);
  assert.equal(reportEdit.json().data.instructions, "Check the counter.");
  const conflictingDate = await app.inject({
    method: "PUT",
    url: `/crm/duty-reports/${reportId}`,
    payload: { performedDate: tomorrow, actions: "Must not overwrite another report." }
  });
  assert.equal(conflictingDate.statusCode, 409, conflictingDate.body);
  actorUserId = actor.id + 100;
  const forbiddenEdit = await app.inject({
    method: "PUT",
    url: `/crm/duty-reports/${reportId}`,
    payload: { performedDate: today, actions: "Not mine." }
  });
  assert.equal(forbiddenEdit.statusCode, 403, forbiddenEdit.body);
  actorUserId = actor.id;
  denyPermissions = true;
  assert.equal(
    (
      await app.inject({
        method: "PUT",
        url: `/crm/duty-assignments/${assignmentId}`,
        payload: dutyEditPayload
      })
    ).statusCode,
    403
  );
  assert.equal(
    (
      await app.inject({
        method: "PUT",
        url: `/crm/duty-reports/${reportId}`,
        payload: { performedDate: today, actions: "Denied." }
      })
    ).statusCode,
    403
  );
  denyPermissions = false;
  await app.inject({
    method: "PUT",
    url: `/crm/duty-reports/${reportId}`,
    payload: { performedDate: today, actions: "Counter checked." }
  });
  await app.close();
  await database.destroy();

  database = openDatabase();
  const persisted = await database
    .selectFrom("crm_duty_reports")
    .select(["id", "actions"])
    .where("id", "=", reportId)
    .executeTakeFirstOrThrow();
  assert.equal(persisted.actions, "Counter checked.");
});
