import { recordWorkEvent } from "../../apps/crm/api/src/modules/work-report/index.js";
import { seedStatusMaster } from "../../apps/crm/api/src/modules/status/index.js";
import { seedPriorityMaster } from "../../apps/crm/api/src/modules/priority/index.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { createConnection } from "mysql2/promise";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { createApiApp } from "@codexsun/framework/api";
import { env } from "../../apps/platform/api/src/env.js";
import {
  migrateCoreTenantDatabase,
  seedCoreTenantDatabase,
  getCoreDatabase,
  closeCoreDatabase
} from "../../apps/core/api/src/database/core-database.js";
import { migrateTenantRuntimeModule } from "../../apps/platform/api/src/modules/tenant/tenant.migration.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import {
  registerEnquiryWhatsAppRoutes,
  migrateEnquiryWhatsApp
} from "../../apps/crm/api/src/modules/enquiry-whatsapp/index.js";
test(
  "WhatsApp handoffs persist actor, timestamp, message and enforce scope and retries",
  { timeout: 60000 },
  async (suite) => {
    assert.equal(env.NODE_ENV, "development");
    const name = `codexsun_whatsapp_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const admin = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });
    const app = await createApiApp({
      appName: "codexsun-whatsapp-e2e",
      cookieSecret: "codexsun-whatsapp-test-secret",
      corsOrigins: [],
      environment: "development"
    });
    suite.after(async () => {
      await app.close();
      await closeCoreDatabase();
      assert.match(name, /^codexsun_whatsapp_e2e_[a-f0-9]{16}$/);
      await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      await admin.end();
    });
    await migrateCoreTenantDatabase(name);
    await seedCoreTenantDatabase(name);
    const db = getCoreDatabase(name);
    await migrateTenantRuntimeModule(db as never);
    await migrateCrmTenantDatabase(db as never);
    await migrateEnquiryWhatsApp(db as never);
    await sql`INSERT INTO app_users (uuid,name,email,password_hash,status) VALUES ('whatuser','Message Tester','message@example.test','test-only','active')`.execute(
      db
    );
    await seedStatusMaster(db as never);
    await seedPriorityMaster(db as never);
    await sql`INSERT INTO crm_enquiries (enquiry_no,title,description,enquired_at,created_by,status_id,priority_id) SELECT 1,'WhatsApp fixture','Test',UTC_TIMESTAMP(),'message@example.test',s.id,p.id FROM crm_enquiry_statuses s,crm_enquiry_priorities p WHERE s.code='new' AND p.code='normal'`.execute(
      db
    );
    let failAction = false;
    let allowed = true;
    let mobile: string | null = "9876543210";
    await registerEnquiryWhatsAppRoutes(app, async () => ({
      database: db as never,
      actorEmail: "message@example.test",
      recordHandoff: async (trx, enquiryId, message) => {
        if (failAction) throw new Error("Test action failure");
        await recordWorkEvent(
          {
            database: db as never,
            actorEmail: "message@example.test",
            actorUserId: null,
            authorize: async () => {}
          },
          trx as never,
          { enquiryId, taskId: null },
          "whatsapp-handoff",
          message
        );
      },
      verifyEnquiry: async (id) => {
        if (!allowed || id !== 1) throw AppError.forbidden("Denied");
        return { mobile };
      }
    }));
    const body = {
      message: "Bill ready & delivered\nPlease acknowledge.",
      requestId: "whatsapp-retry-01"
    };
    const send = () =>
      app.inject({ method: "POST", url: "/crm/enquiries/1/whatsapp-messages", payload: body });
    const first = await send();
    assert.equal(first.statusCode, 200, first.body);
    const again = await send();
    assert.equal(again.json().data.id, first.json().data.id);
    assert.equal(new URL(first.json().data.url).searchParams.get("text"), body.message);
    const history = await app.inject({ method: "GET", url: "/crm/enquiries/1/whatsapp-messages" });
    assert.equal(history.statusCode, 200, history.body);
    const rows = history.json().data;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].message, body.message);
    assert.equal(rows[0].userName, "Message Tester");
    assert.equal(rows[0].recipient, "919876543210");
    assert.ok(rows[0].createdAt);
    const actions = await sql<{
      action: string;
      body: string;
    }>`SELECT action,body FROM crm_work_reports WHERE enquiry_id=1`.execute(db);
    assert.equal(actions.rows.length, 1);
    assert.equal(actions.rows[0].action, "whatsapp-handoff");
    assert.equal(actions.rows[0].body, body.message);
    failAction = true;
    body.requestId = "whatsapp-failure-01";
    assert.equal((await send()).statusCode, 500);
    const saved = await sql<{
      count: number;
    }>`SELECT COUNT(*) AS count FROM crm_enquiry_whatsapp_messages`.execute(db);
    assert.equal(
      Number(saved.rows[0].count),
      1,
      "handoff must roll back when action logging fails"
    );
    failAction = false;
    body.requestId = "whatsapp-retry-01";

    body.message = "Changed";
    assert.equal((await send()).statusCode, 409);
    allowed = false;
    assert.equal((await send()).statusCode, 403);
    assert.equal(
      (await app.inject({ method: "GET", url: "/crm/enquiries/1/whatsapp-messages" })).statusCode,
      403
    );
    allowed = true;
    mobile = null;
    body.requestId = "whatsapp-retry-02";
    assert.equal((await send()).statusCode, 400);
  }
);
