import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createConnection } from "mysql2/promise";
import { sql, type Kysely } from "kysely";
import { env } from "../../apps/platform/api/src/env.js";
import {
  getPlatformDatabase,
  closePlatformDatabase
} from "../../apps/platform/api/src/database/platform-database.js";
import { migrateQueueManagerModule } from "../../apps/platform/api/src/modules/queue-manager/queue-manager.migration.js";
import { migratePlatformActivityModule } from "../../apps/platform/api/src/modules/platform-activity/platform-activity.migration.js";
import { QueueManagerService } from "../../apps/platform/api/src/modules/queue-manager/queue-manager.service.js";
import { QueueManagerRepository } from "../../apps/platform/api/src/modules/queue-manager/queue-manager.repository.js";
import { registerQueueJobProcessor } from "../../apps/platform/api/src/modules/queue-manager/queue-manager.worker.js";
import {
  migrateCoreTenantDatabase,
  seedCoreTenantDatabase,
  getCoreDatabase,
  closeCoreDatabase
} from "../../apps/core/api/src/database/core-database.js";
import { resolveExternalContactForDatabase } from "../../apps/core/api/src/modules/master/contact/index.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import { migrateTenantRuntimeModule } from "../../apps/platform/api/src/modules/tenant/tenant.migration.js";
import { crmDutySyncIdempotencyKey, CrmFrappeSyncRepository } from "@codexsun/crm-api";
import {
  migrateFrappeTenantDatabase,
  FrappeConnectionRepository
} from "../../apps/frappe/api/src/modules/connection/index.js";
import { FrappeLiveSyncService } from "../../apps/frappe/api/src/modules/live-sync/index.js";
import {
  processContactExport,
  requestContactExport,
  contactDeliveryStates,
  type ContactExportDatabase
} from "../../apps/frappe/api/src/modules/export/export.contact.js";

test(
  "immediate contact exports retain first errors and recover a lost create response without duplicates",
  { timeout: 60000 },
  async (suite) => {
    assert.equal(env.NODE_ENV, "development");
    const name = `codexsun_contact_queue_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const originalMaster = env.DB_MASTER_NAME;
    const originalWorker = env.CODEXSUN_QUEUE_WORKER_ENABLED;
    const originalFetch = globalThis.fetch;
    const admin = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });
    suite.after(async () => {
      globalThis.fetch = originalFetch;
      await closePlatformDatabase();
      await closeCoreDatabase();
      env.DB_MASTER_NAME = originalMaster;
      env.CODEXSUN_QUEUE_WORKER_ENABLED = originalWorker;
      assert.match(name, /^codexsun_contact_queue_[a-f0-9]{16}$/);
      await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      await admin.end();
    });
    await migrateCoreTenantDatabase(name);
    await seedCoreTenantDatabase(name);
    const db = getCoreDatabase(name) as unknown as Kysely<ContactExportDatabase>;
    await migrateTenantRuntimeModule(db as never);
    await migrateCrmTenantDatabase(db);
    await migrateFrappeTenantDatabase(db);
    env.DB_MASTER_NAME = name;
    env.CODEXSUN_QUEUE_WORKER_ENABLED = "1";
    await migrateQueueManagerModule(getPlatformDatabase());
    await migratePlatformActivityModule(getPlatformDatabase());
    await new QueueManagerRepository().setBackend("database", "e2e");
    const defaults = {
      baseUrl: "https://frappe.example/",
      apiKey: "e2e",
      apiSecret: "e2e",
      enabled: true
    };
    const connection = new FrappeConnectionRepository(db);
    await connection.saveConnection({ ...defaults, connectionName: "E2E" }, env.JWT_SECRET);
    await connection.recordVerification("verified");
    const live = new FrappeLiveSyncService(db);
    await live.save(
      {
        enabled: true,
        paused: false,
        direction: "bidirectional",
        scheduleMinutes: 1,
        modules: { contacts: true, enquiries: true, activities: false, "call-logs": false }
      },
      "e2e"
    );
    assert.equal((await live.settings()).scheduleMinutes, 1);
    const contact = await resolveExternalContactForDatabase(name, {
      externalKey: "a".repeat(64),
      externalCode: "CUSTOMER-EXACT",
      name: "Test customer",
      mobile: "9876543210"
    });
    const events = new CrmFrappeSyncRepository(db);
    const queue = new QueueManagerService();
    registerQueueJobProcessor("e2e.contact-export", (job) =>
      processContactExport(db, Number(job.payload.queueId), env.JWT_SECRET, defaults)
    );
    let posts = 0;
    let puts = 0;
    let exists = false;
    let missingCustomer = false;
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      const path = decodeURIComponent(url.pathname);
      assert.equal(url.origin, "https://frappe.example");
      if (path === "/api/resource/Customer")
        return Response.json({ data: missingCustomer ? [] : [{ name: "CUSTOMER-EXACT" }] });
      if (path === "/api/resource/Mobile Contact" && (!init?.method || init.method === "GET"))
        return Response.json({
          data: exists ? [{ name: "MOBILE-ONE", mobile_number: "9876543210" }] : []
        });
      if (path.startsWith("/api/resource/Mobile Contact")) {
        if (init?.method === "POST") {
          posts++;
          exists = true;
          throw new Error("Response lost after remote commit");
        }
        if (init?.method === "PUT") puts++;
        return Response.json({ data: { name: "MOBILE-ONE", mobile_number: "9876543210" } });
      }
      throw new Error(`Unexpected remote call: ${path}`);
    };
    async function dispatch() {
      const event = await events.find("contact", contact.id);
      assert.ok(event);
      const job = await queue.enqueue({
        jobName: "e2e.contact-export",
        queueName: "crm",
        sourceModule: "e2e",
        payload: { queueId: event.id },
        maxAttempts: 1,
        dispatchImmediately: true,
        idempotencyKey: crmDutySyncIdempotencyKey(
          "e2e",
          event.uuid,
          event.attempts,
          event.dispatch_revision
        )
      });
      assert.ok(job);
      for (let i = 0; i < 200; i++) {
        const current = await queue.findJob(job.id);
        if (current?.status === "completed" || current?.status === "failed") return current;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      assert.fail("Immediate dispatch did not finish within two seconds");
    }
    await requestContactExport(db, contact.id, "e2e");
    assert.equal((await dispatch()).status, "failed");
    const first = (await contactDeliveryStates(db, [contact.id]))[0]!;
    assert.equal(first.status, "pending");
    assert.match(first.message!, /Frappe could not be reached/);
    assert.equal(posts, 1);
    await sql`UPDATE crm_frappe_sync_queue SET available_at=UTC_TIMESTAMP() WHERE entity_type='contact' AND local_record_id=${contact.id}`.execute(
      db
    );
    assert.equal((await dispatch()).status, "completed");
    assert.equal((await events.find("contact", contact.id))?.status, "synced");
    assert.equal(posts, 1, "Retry must reuse the Mobile Contact created before response loss");
    assert.equal(puts, 1);
    await requestContactExport(db, contact.id, "e2e");
    assert.equal((await events.find("contact", contact.id))?.attempts, 0);
    assert.equal(
      (await dispatch()).status,
      "completed",
      "A new edit must not reuse an old completed queue job"
    );
    assert.equal(puts, 2);
    missingCustomer = true;
    await requestContactExport(db, contact.id, "e2e");
    assert.equal((await dispatch()).status, "failed");
    assert.match(
      (await contactDeliveryStates(db, [contact.id]))[0]!.message!,
      /No new Frappe record/
    );
    assert.equal(posts, 1, "Missing customer identity must never create a guessed Customer");
  }
);
