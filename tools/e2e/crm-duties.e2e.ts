import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import Fastify from "fastify";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { env } from "../../apps/platform/api/src/env.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import { seedSopPermissions } from "../../apps/crm/api/src/modules/sop/sop.seed.js";
import { sopModule, type SopDatabase } from "../../apps/crm/api/src/modules/sop/index.js";
import { sopItemModule, type SopItemDatabase } from "../../apps/crm/api/src/modules/sop-item/index.js";
import { dutyAssignmentModule, type DutyAssignmentDatabase } from "../../apps/crm/api/src/modules/duty-assignment/index.js";
import { dutyReportModule, type DutyReportDatabase } from "../../apps/crm/api/src/modules/duty-report/index.js";
import { crmDutySyncIdempotencyKey, enqueueCrmFrappeSync } from "../../apps/crm/api/src/modules/frappe-sync/index.js";
import { processCrmDutySync } from "@codexsun/frappe-api";
import type { FrappeSettings } from "../../apps/frappe/api/src/modules/connection/index.js";

assert.equal(env.NODE_ENV, "development", "This suite uses only the local development database.");
assert.notEqual(env.DEFAULT_TENANT_DB_NAME, env.DB_MASTER_NAME);

function openDatabase() {
  return new Kysely<DutyReportDatabase>({ dialect: new MysqlDialect({ pool: createPool({ database: env.DEFAULT_TENANT_DB_NAME, host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER, password: env.DB_PASSWORD, timezone: "Z", connectionLimit: 2 }) }) });
}

test("CRM SOP publishing, assignment, mobile reporting, and outbound queue persist locally", async (suite) => {
  let database = openDatabase();
  const app = Fastify({ logger: false });
  let sopId: number | null = null;
  let itemId: number | null = null;
  let assignmentId: number | null = null;
  let reportId: number | null = null;
  let appClosed = false;
  let databaseClosed = false;
  let actorUserId: number | null = null;
  let denyPermissions = false;
  let denyAllReports = false;
  await migrateCrmTenantDatabase(database as never);
  await seedSopPermissions(database as unknown as Kysely<SopDatabase>);
  const actor = await database.selectFrom("app_users").select(["id", "email"]).where("status", "=", "active").executeTakeFirstOrThrow();
  actorUserId = actor.id;
  const scope = async () => ({ database, actorEmail: actor.email, actorUserId, authorize: async (permission: string) => { if (denyPermissions || (permission === "crm.duty-report.view.all" && denyAllReports)) throw Object.assign(new Error("Forbidden"), { statusCode: 403 }); } });
  await sopModule.register(app, scope as never);
  await sopItemModule.register(app, scope as never);
  await dutyAssignmentModule.register(app, scope as never);
  await dutyReportModule.register(app, scope as never);
  await app.ready();
  actorUserId = null;
  const missingActor = await app.inject({ method: "GET", url: "/crm/duty-reports?scope=own" });
  assert.equal(missingActor.statusCode, 403, "own report access must fail closed without an active actor");
  actorUserId = actor.id;
  denyAllReports = true;
  const deniedAll = await app.inject({ method: "GET", url: "/crm/duty-reports?scope=all" });
  assert.equal(deniedAll.statusCode, 403, "all report access must require its explicit permission");
  denyAllReports = false;
  denyPermissions = true;
  const deniedOwn = await app.inject({ method: "GET", url: "/crm/duty-reports?scope=own" });
  assert.equal(deniedOwn.statusCode, 403, "own report permission denial must be enforced");
  denyPermissions = false;
  suite.after(async () => {
    if (reportId) await database.deleteFrom("crm_duty_reports").where("id", "=", reportId).execute();
    if (assignmentId) await database.deleteFrom("crm_duty_assignments").where("id", "=", assignmentId).execute();
    if (itemId) {
      await database.deleteFrom("crm_frappe_sync_queue").where("entity_type", "=", "sop-item").where("local_record_id", "=", itemId).execute();
      await database.deleteFrom("crm_sop_item_revisions").where("sop_item_id", "=", itemId).execute();
      await database.deleteFrom("crm_sop_items").where("id", "=", itemId).execute();
    }
    if (assignmentId) await database.deleteFrom("crm_frappe_sync_queue").where("entity_type", "=", "duty-assignment").where("local_record_id", "=", assignmentId).execute();
    if (reportId) await database.deleteFrom("crm_frappe_sync_queue").where("entity_type", "=", "duty-report").where("local_record_id", "=", reportId).execute();
    if (sopId) await database.deleteFrom("crm_sops").where("id", "=", sopId).execute();
    if (!appClosed) await app.close();
    if (!databaseClosed) await database.destroy();
  });

  const code = `E2E-${randomUUID().slice(0, 8)}`;
  const createdSop = await app.inject({ method: "POST", url: "/crm/sops", payload: { code, title: "E2E daily inspection", purpose: "Verify local duty workflow." } });
  assert.equal(createdSop.statusCode, 200, createdSop.body);
  sopId = createdSop.json().data.id;
  const createdItem = await app.inject({ method: "POST", url: "/crm/sop-items", payload: { sopId, code: "OPEN", title: "Opening check", department: "Stores", frequency: "daily", sortOrder: 1, revision: { instructions: "Check the counter.", evidenceGuidance: "Record any issue." } } });
  assert.equal(createdItem.statusCode, 200, createdItem.body);
  itemId = createdItem.json().data.id;
  const revisionId = createdItem.json().data.currentRevision.id;
  const published = await app.inject({ method: "POST", url: `/crm/sop-items/${itemId}/revisions/${revisionId}/publish` });
  assert.equal(published.statusCode, 200, published.body);
  const renamedSop = await app.inject({ method:"PUT",url:`/crm/sops/${sopId}`,payload:{code,title:"E2E daily inspection updated",purpose:"Verify local duty workflow."} });
  assert.equal(renamedSop.statusCode,200,renamedSop.body);
  const today = new Date().toISOString().slice(0, 10);
  const assigned = await app.inject({ method: "POST", url: "/crm/duty-assignments", payload: { sopItemId: itemId, revisionId, assigneeUserId: actor.id, displayOrder: 1, startDate: today, endDate: null } });
  assert.equal(assigned.statusCode, 200, assigned.body);
  assignmentId = assigned.json().data.id;
  const myDuties = await app.inject({ method: "GET", url: "/crm/duties" });
  assert.equal(myDuties.statusCode, 200, myDuties.body);
  assert.ok(myDuties.json().data.some((duty: { id: number }) => duty.id === assignmentId));
  const submitted = await app.inject({ method: "POST", url: "/crm/duty-reports", payload: { assignmentId, performedDate: today, actions: "Counter checked.", result: "completed", issueDetails: "" } });
  assert.equal(submitted.statusCode, 200, submitted.body);
  reportId = submitted.json().data.id;
  const retried = await app.inject({ method: "POST", url: "/crm/duty-reports", payload: { assignmentId, performedDate: today, actions: "A retried payload.", result: "completed", issueDetails: "" } });
  assert.equal(retried.statusCode, 200, retried.body);
  assert.equal(retried.json().data.id, reportId, "same recurrence must return the existing report");
  assert.equal(retried.json().data.actions, "Counter checked.");
  const reportHistory = await app.inject({ method: "GET", url: `/crm/duty-reports?scope=all&search=${encodeURIComponent("Counter checked")}&from=${today}&to=${today}&page=1&pageSize=1` });
  assert.equal(reportHistory.statusCode,200,reportHistory.body);
  assert.equal(reportHistory.json().data.items.length,1);
  assert.ok(reportHistory.json().data.total>=1);
  assert.equal(reportHistory.json().data.summary.completed>=1,true);
  const queueRows = await database.selectFrom("crm_frappe_sync_queue").select(["entity_type", "local_record_id", "status"]).where("entity_type", "in", ["sop-item", "duty-assignment", "duty-report"]).execute();
  assert.ok(queueRows.some((row) => row.entity_type === "sop-item" && row.local_record_id === itemId));
  assert.ok(queueRows.some((row) => row.entity_type === "duty-assignment" && row.local_record_id === assignmentId));
  assert.ok(queueRows.some((row) => row.entity_type === "duty-report" && row.local_record_id === reportId));
  const dispatchRow = await database.selectFrom("crm_frappe_sync_queue").select(["uuid","attempts"]).where("entity_type","=","duty-report").where("local_record_id","=",reportId).executeTakeFirstOrThrow();
  assert.equal(crmDutySyncIdempotencyKey("tenant-test",dispatchRow.uuid,dispatchRow.attempts),`crm-duty-sync:tenant-test:${dispatchRow.uuid}:${dispatchRow.attempts}`);

  const workerEvents = await database.selectFrom("crm_frappe_sync_queue")
    .select(["id", "entity_type"])
    .where("entity_type", "in", ["sop-item", "duty-assignment", "duty-report"])
    .where("local_record_id", "in", [itemId, assignmentId, reportId])
    .execute();
  const outbound: Array<{ url: string; method: string; body: Record<string, unknown> }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    outbound.push({ url: String(input), method: init?.method ?? "GET", body: JSON.parse(String(init?.body ?? "{}")) });
    return new Response(JSON.stringify({ data: { name: `REMOTE-${outbound.length}` } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const settings: FrappeSettings = { baseUrl: "https://frappe.test", apiKey: "test-key", apiSecret: "test-secret", enabled: true };
    for (const entityType of ["sop-item", "duty-assignment", "duty-report"] as const) {
      const event = workerEvents.find((row) => row.entity_type === entityType);
      assert.ok(event, `missing ${entityType} queue event`);
      if (entityType === "duty-report") {
        const results = await Promise.all([processCrmDutySync(database as never,event.id,settings,async()=>"HR-EMP-00001"),processCrmDutySync(database as never,event.id,settings,async()=>"HR-EMP-00001")]);
        assert.equal(results.filter((result)=>result.status==="synced").length,1,"atomic queue claim allows one worker to send the event");
        assert.equal(results.filter((result)=>result.status==="skipped").length,1,"a concurrent worker skips an already claimed event");
      } else await processCrmDutySync(database as never, event.id, settings, async () => "HR-EMP-00001");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.deepEqual(outbound.map((request) => new URL(request.url).pathname), [
    "/api/resource/SOP%20Item",
    "/api/resource/SOP%20Assigned",
    "/api/resource/SOP%20Reporting",
  ]);
  assert.equal(outbound[1]?.body.sop_item, "REMOTE-1");
  assert.equal(outbound[1]?.body.user, "HR-EMP-00001");
  assert.equal(outbound[0]?.body.sop_name,"E2E daily inspection updated","SOP title edits queue a fresh published item document");
  assert.equal(outbound[2]?.body.sop_item, "REMOTE-1");
  const delivered = await database.selectFrom("crm_frappe_sync_queue")
    .select(["entity_type", "status", "remote_name"])
    .where("entity_type", "in", ["sop-item", "duty-assignment", "duty-report"])
    .where("local_record_id", "in", [itemId, assignmentId, reportId])
    .execute();
  assert.equal(delivered.filter((event) => event.status === "synced").length, 3);
  await database.updateTable("crm_frappe_sync_queue").set({status:"pending",attempts:0,remote_name:null,last_error:null}).where("entity_type","=","duty-report").where("local_record_id","=",reportId).execute();
  const retryEvent=workerEvents.find((row)=>row.entity_type==="duty-report")!;
  try {
    globalThis.fetch=async()=>new Response(JSON.stringify({message:"temporary outage"}),{status:503,headers:{"content-type":"application/json"}});
    await assert.rejects(processCrmDutySync(database as never,retryEvent.id,{baseUrl:"https://frappe.test",apiKey:"test-key",apiSecret:"test-secret",enabled:true},async()=>"HR-EMP-00001"));
    const retryState=await database.selectFrom("crm_frappe_sync_queue").select(["status","attempts"]).where("id","=",retryEvent.id).executeTakeFirstOrThrow();
    assert.equal(retryState.status,"pending");
    assert.equal(retryState.attempts,1);
    globalThis.fetch=async()=>new Response(JSON.stringify({data:{name:"REMOTE-REPORT-RETRY"}}),{status:200,headers:{"content-type":"application/json"}});
    await processCrmDutySync(database as never,retryEvent.id,{baseUrl:"https://frappe.test",apiKey:"test-key",apiSecret:"test-secret",enabled:true},async()=>"HR-EMP-00001");
    const retryDelivered=await database.selectFrom("crm_frappe_sync_queue").select(["status","attempts"]).where("id","=",retryEvent.id).executeTakeFirstOrThrow();
    assert.equal(retryDelivered.status,"synced");
    assert.equal(retryDelivered.attempts,2);
  } finally { globalThis.fetch=originalFetch; }
  await database.updateTable("crm_frappe_sync_queue").set({status:"pending",attempts:0,remote_name:null,last_error:null}).where("id","=",retryEvent.id).execute();
  let signalStarted!:()=>void; let releaseFetch!:()=>void;
  const fetchStarted=new Promise<void>(resolve=>{signalStarted=resolve;});
  const fetchGate=new Promise<void>(resolve=>{releaseFetch=resolve;});
  globalThis.fetch=async()=>{signalStarted();await fetchGate;return new Response(JSON.stringify({data:{name:"REMOTE-REPORT-RESYNC"}}),{status:200,headers:{"content-type":"application/json"}});};
  try {
    const inFlight=processCrmDutySync(database as never,retryEvent.id,{baseUrl:"https://frappe.test",apiKey:"test-key",apiSecret:"test-secret",enabled:true},async()=>"HR-EMP-00001");
    await fetchStarted;
    await enqueueCrmFrappeSync(database as never,"duty-report",reportId,actor.email);
    releaseFetch();
    await inFlight;
    const resyncState=await database.selectFrom("crm_frappe_sync_queue").select(["status","remote_name"]).where("id","=",retryEvent.id).executeTakeFirstOrThrow();
    assert.equal(resyncState.status,"pending","updates arriving during delivery are retained for a follow-up PUT");
    globalThis.fetch=async(_input,init)=>new Response(JSON.stringify({data:{name:"REMOTE-REPORT-RESYNC"}}),{status:200,headers:{"content-type":"application/json"}});
    await processCrmDutySync(database as never,retryEvent.id,{baseUrl:"https://frappe.test",apiKey:"test-key",apiSecret:"test-secret",enabled:true},async()=>"HR-EMP-00001");
  } finally { globalThis.fetch=originalFetch; }
  await app.close();
  appClosed = true;
  await database.destroy();
  databaseClosed = true;

  database = openDatabase();
  databaseClosed = false;
  const persisted = await database.selectFrom("crm_duty_reports").select(["id", "actions"]).where("id", "=", reportId).executeTakeFirstOrThrow();
  assert.equal(persisted.actions, "Counter checked.");
});
