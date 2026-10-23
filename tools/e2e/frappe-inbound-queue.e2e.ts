import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { test } from "node:test";
import { createConnection } from "mysql2/promise";
import { sql, type Kysely } from "kysely";
import { runMigrationBatch } from "@codexsun/framework/db";
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
import { migrateTenantRuntimeModule } from "../../apps/platform/api/src/modules/tenant/tenant.migration.js";
import {
  migrateCoreTenantDatabase,
  seedCoreTenantDatabase,
  getCoreDatabase,
  closeCoreDatabase
} from "../../apps/core/api/src/database/core-database.js";
import {
  getActiveContactForDatabase,
  resolveOrCreateCustomerForDatabase,
  resolveExternalContactForDatabase
} from "../../apps/core/api/src/modules/master/contact/index.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import { seedStatusMaster } from "../../apps/crm/api/src/modules/status/index.js";
import { seedPriorityMaster } from "../../apps/crm/api/src/modules/priority/index.js";
import {
  EnquiryRepository,
  EnquiryService,
  EnquirySyncRepository
} from "@codexsun/crm-api/enquiry-sync";
import {
  migrateFrappeTenantDatabase,
  frappeTenantMigrationBatch,
  FrappeConnectionRepository,
  type FrappeDatabase
} from "../../apps/frappe/api/src/modules/connection/index.js";
import { FrappeLiveSyncService } from "../../apps/frappe/api/src/modules/live-sync/index.js";
import {
  processFrappeEnquiryImportJob,
  frappeEnquiryImportJobName,
  processLocalEnquirySync
} from "../../apps/frappe/api/src/modules/enquiry-sync/index.js";
import type { EnquirySyncContext } from "../../apps/frappe/api/src/modules/enquiry-sync/enquiry-sync.types.js";
import { withEnquiryImportLock } from "../../apps/frappe/api/src/modules/enquiry-sync/enquiry-sync.lock.js";
import { EnquirySourceRepository } from "../../apps/frappe/api/src/modules/enquiry-sync/enquiry-sync.source.repository.js";
import {
  frappeInboundModifiedAfter,
  approvedFrappeAutomaticExports
} from "../../apps/platform/api/src/modules/queue-manager/frappe-live-sync.policy.js";

test(
  "inbound history, successful checkpoints, queue retries, and retained source fields",
  { timeout: 120000 },
  async (suite) => {
    assert.equal(env.NODE_ENV, "development");
    const name = `codexsun_inbound_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const originalMaster = env.DB_MASTER_NAME;
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
      assert.match(name, /^codexsun_inbound_e2e_[a-f0-9]{16}$/);
      await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      await admin.end();
    });
    await migrateCoreTenantDatabase(name);
    await seedCoreTenantDatabase(name);
    const db = getCoreDatabase(name) as unknown as Kysely<FrappeDatabase>;
    await migrateTenantRuntimeModule(db as never);
    await migrateCrmTenantDatabase(db);
    await seedStatusMaster(db);
    await seedPriorityMaster(db);
    await runMigrationBatch(db, {
      ...frappeTenantMigrationBatch,
      steps: frappeTenantMigrationBatch.steps.filter((step) => step.version <= 8)
    });
    await sql`UPDATE frappe_live_sync_settings SET schedule_minutes=30 WHERE id=1`.execute(db);
    await migrateFrappeTenantDatabase(db);
    await migrateFrappeTenantDatabase(db);
    assert.equal(
      (await new FrappeLiveSyncService(db).settings()).scheduleMinutes,
      30,
      "Upgrade preserves existing settings"
    );
    env.DB_MASTER_NAME = name;
    const platform = getPlatformDatabase();
    await migrateQueueManagerModule(platform);
    await migratePlatformActivityModule(platform);
    await new QueueManagerRepository().setBackend("database", "e2e");
    const connection = new FrappeConnectionRepository(db);
    const remoteSettings = {
      baseUrl: "https://frappe.example/",
      apiKey: "e2e",
      apiSecret: "e2e",
      enabled: true
    };
    await connection.saveConnection({ ...remoteSettings, connectionName: "E2E" }, env.JWT_SECRET);
    await connection.recordVerification("verified");
    const live = new FrappeLiveSyncService(db);
    assert.equal((await live.settings()).direction, "inbound");
    await live.save(
      {
        enabled: true,
        paused: false,
        direction: "inbound",
        scheduleMinutes: 5,
        modules: { contacts: false, enquiries: true, activities: false, "call-logs": false }
      },
      "e2e"
    );
    assert.deepEqual(approvedFrappeAutomaticExports(await live.dueKinds(), "inbound"), []);
    assert.equal((await live.settings()).inboundCheckpointAt, null);

    const repository = new EnquiryRepository(db);
    const enquiries = new EnquiryService(
      repository,
      {
        contact: (id) => getActiveContactForDatabase(name, id),
        resolveOrCreateCustomer: (input, transaction) =>
          resolveOrCreateCustomerForDatabase(name, input, transaction as never),
        resolveExternalCustomer: (input) => resolveExternalContactForDatabase(name, input),
        user: async () => null,
        listIn: async () => null,
        status: async (id) =>
          (await db
            .selectFrom("crm_enquiry_statuses")
            .select(["name", "code"])
            .where("id", "=", id)
            .executeTakeFirst()) ?? null,
        priority: async (id) =>
          (await db
            .selectFrom("crm_enquiry_priorities")
            .select("name")
            .where("id", "=", id)
            .executeTakeFirst()) ?? null
      },
      { actorEmail: "e2e", actorUserId: null, canViewAll: true }
    );
    const context: EnquirySyncContext = {
      database: db,
      createEnquiry: (input) => enquiries.create(input, "e2e"),
      createImportedEnquiry: (input, source) => enquiries.createImported(input, "e2e", source),
      updateEnquiry: (id, input) => enquiries.update(id, input, "e2e"),
      updateImportedEnquiry: (id, input, source) =>
        enquiries.updateImported(id, input, "e2e", source),
      importComment: (id, comment) => enquiries.importComment(id, comment),
      localUserForEmployee: async () => null,
      listInForName: async () => null
    };
    const queue = new QueueManagerService();
    registerQueueJobProcessor(frappeEnquiryImportJobName, (job, report) =>
      processFrappeEnquiryImportJob(
        context,
        remoteSettings,
        env.JWT_SECRET,
        String(job.payload.baseUrl),
        typeof job.payload.modifiedAfter === "string" ? job.payload.modifiedAfter : undefined,
        report,
        String(job.payload.checkpointAt)
      )
    );
    let failComments = true;
    let commentText = "First comment";
    let modified = "2026-01-02 10:00:00.123456";
    let invalidStatus = false;
    const filters: unknown[] = [];
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.origin, "https://frappe.example");
      if (url.pathname.includes("get_list")) {
        if (failComments) throw new Error("Simulated source outage after enquiry persistence");
        const body = JSON.parse(String(init?.body));
        assert.equal(body.doctype, "Job Comments");
        return Response.json({
          message: [
            {
              name: "JC-parent",
              job_type: "Enquiry",
              job_id: "Q930",
              comment: commentText,
              creation: "2026-01-02 11:00:00",
              modified,
              owner: "source@example.test",
              custom_comment_field: "Retain me"
            },
            {
              name: "JC-reply",
              job_type: "Enquiry",
              job_id: "Q930",
              parent_comment: "JC-parent",
              comment: "Reply",
              mode: "Reply",
              creation: "2026-01-02 12:00:00",
              modified,
              owner: "source@example.test"
            }
          ]
        });
      }
      assert.equal(init?.method, "GET", "Inbound sync never writes to Frappe");
      if (url.pathname.endsWith("/Comment")) return Response.json({ data: [] });
      if (url.pathname.endsWith("/Customer/C1"))
        return Response.json({ data: { customer_name: "Source customer" } });
      if (url.pathname.endsWith("/Enquiry")) {
        filters.push(url.searchParams.get("filters"));
        return Response.json({
          data: [
            { name: "Q930", modified },
            { name: "ENQ930", modified }
          ]
        });
      }
      const remoteName = url.pathname.split("/").at(-1);
      assert.ok(["Q930", "ENQ930"].includes(remoteName ?? ""));
      assert.equal(url.searchParams.get("fields"), null, "Read complete source documents");
      return Response.json({
        data: {
          name: remoteName,
          creation: "2026-01-01 10:00:00",
          modified,
          title: "Source enquiry",
          mobile: "9994885548",
          mobile_customer: "9994885548 - C1",
          customer: "C1",
          company_name: "Source company",
          address: "Full source address",
          custom_future_field: { keep: ["all", "values"] },
          date: "2026-01-01",
          status: invalidStatus ? "Unknown status" : "",
          priority: "",
          assigned_to_employee: null,
          group: null
        }
      });
    };
    const enqueue = async (checkpointAt: string, modifiedAfter?: string) => {
      const job = await queue.enqueue({
        jobName: frappeEnquiryImportJobName,
        queueName: "reports",
        sourceModule: "frappe.live-sync",
        actorEmail: "e2e",
        tenantId: "e2e",
        idempotencyKey: `inbound:${randomUUID()}`,
        maxAttempts: 3,
        payload: {
          baseUrl: remoteSettings.baseUrl,
          tenantDatabase: name,
          checkpointAt,
          ...(modifiedAfter ? { modifiedAfter } : {})
        }
      });
      assert.ok(job);
      return job;
    };
    const first = await enqueue("2026-10-01T00:00:00.000Z");
    const failed = await queue.runJob(first.id);
    assert.equal(failed?.status, "pending");
    assert.equal((await live.settings()).inboundCheckpointAt, null);
    assert.equal((await db.selectFrom("crm_enquiries").selectAll().execute()).length, 2);
    assert.equal(filters[0], null, "Historical import has no time cutoff");
    failComments = false;
    await queue.retryJob(first.id);
    assert.equal((await queue.runJob(first.id))?.status, "completed");
    assert.equal((await live.settings()).inboundCheckpointAt, "2026-10-01T00:00:00.000Z");
    let rows = await db.selectFrom("crm_enquiries").selectAll().execute();
    assert.equal(rows.length, 2, "Retry preserves one enquiry per exact remote name");
    assert.equal(
      new Set(rows.map((row) => row.enquiry_no)).size,
      2,
      "Q930 and ENQ930 retain separate identities despite serial collision"
    );
    const q930 = rows.find((row) => row.source_reference === "Q930")!;
    const sourceLink = await connection.byRemoteName("Q930");
    assert.equal(new Date(sourceLink!.sourceModifiedAt!).toISOString(), "2026-01-02T04:30:00.123Z");
    let comments = await db
      .selectFrom("crm_enquiry_comments")
      .selectAll()
      .where("enquiry_id", "=", q930.id)
      .execute();
    assert.equal(comments.length, 2);
    assert.equal(
      comments.find((row) => row.body === "Reply")?.parent_id,
      comments.find((row) => row.body === "First comment")?.id
    );
    assert.equal((await enquiries.get(q930.id)).status, "new");
    assert.equal((await enquiries.get(q930.id)).priority, "normal");
    const source = new EnquirySourceRepository(db);
    const revisions = await source.revisions(q930.id);
    const retained = revisions
      .map((row) => JSON.parse(row.documentJson))
      .find((row) => row.enquiry)?.enquiry;
    assert.deepEqual(retained.custom_future_field, { keep: ["all", "values"] });
    assert.equal(retained.address, "Full source address");
    assert.equal(retained.company_name, "Source company");
    assert.equal(retained.mobile_customer, "9994885548 - C1");
    const countBefore = revisions.length;

    await db
      .updateTable("crm_enquiries")
      .set({ captured_email: "local-only@example.test", updated_at: sql`updated_at` })
      .where("id", "=", q930.id)
      .execute();
    await queue.retryJob(first.id);
    assert.equal((await queue.runJob(first.id))?.status, "completed");
    assert.equal(
      (await source.revisions(q930.id)).length,
      countBefore,
      "Unchanged source content does not create duplicate revisions"
    );
    assert.equal((await enquiries.get(q930.id)).capturedEmail, "local-only@example.test");

    modified = "2026-10-02 10:00:00";
    commentText = "Edited source comment";
    const nextBoundary = frappeInboundModifiedAfter(await live.settings(), remoteSettings.baseUrl);
    assert.equal(nextBoundary, "2026-09-30T00:00:00.000Z");
    const next = await enqueue("2026-10-20T00:00:00.000Z", nextBoundary);
    const nextResult = await queue.runJob(next.id);
    assert.equal(nextResult?.status, "completed", JSON.stringify(nextResult));
    comments = await db
      .selectFrom("crm_enquiry_comments")
      .selectAll()
      .where("enquiry_id", "=", q930.id)
      .execute();
    assert.equal(comments.length, 2);
    assert.ok(comments.some((row) => row.body === "Edited source comment"));
    assert.ok(
      (await source.revisions(q930.id)).some((row) => row.documentJson.includes("First comment")),
      "Original source revisions survive edits"
    );
    assert.equal((await live.settings()).inboundCheckpointAt, "2026-10-20T00:00:00.000Z");
    await live.completeInbound(remoteSettings.baseUrl, "2026-10-01T00:00:00.000Z");
    assert.equal(
      (await live.settings()).inboundCheckpointAt,
      "2026-10-20T00:00:00.000Z",
      "Old job completion cannot rewind checkpoint"
    );

    invalidStatus = true;
    modified = "2026-10-21 10:00:00";
    const blocked = await enqueue("2026-10-22T00:00:00.000Z", "2026-10-19T00:00:00.000Z");
    assert.equal((await queue.runJob(blocked.id))?.status, "pending");
    assert.equal((await live.settings()).inboundCheckpointAt, "2026-10-20T00:00:00.000Z");
    assert.ok(
      (await source.revisions(q930.id)).some((row) => row.documentJson.includes("Unknown status")),
      "Failed mapping still preserves the source document"
    );
    await withEnquiryImportLock(db, async () => {
      await assert.rejects(
        () => withEnquiryImportLock(db, async () => {}),
        /Another enquiry import/
      );
    });
    assert.equal(
      (await db.selectFrom("crm_enquiry_sync_events").selectAll().execute()).length,
      0,
      "Inbound writes do not produce outbound echo jobs"
    );
    const sync = new EnquirySyncRepository(db);
    const eventId = await sync.enqueue({
      enquiryId: q930.id,
      actorEmail: "e2e",
      correlationId: "preexisting-job",
      eventType: "enquiry-upsert",
      entityId: null
    });
    await assert.rejects(
      () => processLocalEnquirySync(db, eventId, env.JWT_SECRET, remoteSettings),
      /Automatic enquiry export is paused/
    );
    const deferred = await sync.getEvent(eventId);
    assert.equal(
      deferred?.status,
      "pending",
      "Previously queued outbound work is preserved without sending"
    );
    assert.equal(deferred?.attempts, 0, "Pausing does not consume the outbox retry budget");
    rows = await db.selectFrom("crm_enquiries").selectAll().execute();
    assert.equal(rows.length, 2);
    const other = rows.find((row) => row.id !== q930.id)!;
    const legacyKey = `frappe:${createHash("sha256").update("JC-parent").digest("hex")}`;
    const parent = (await repository.listComments(q930.id)).find((row) => row.parentId === null)!;
    await db
      .updateTable("crm_enquiry_comments")
      .set({ request_id: legacyKey })
      .where("id", "=", parent.id)
      .execute();
    const imported = {
      id: "JC-parent",
      content: "Retained comment",
      author: "changed-owner@example.test",
      createdAt: "2026-10-21T10:00:00.000Z"
    };
    const legacyDuplicate = await db
      .insertInto("crm_enquiry_comments")
      .values({
        request_id: legacyKey,
        enquiry_id: q930.id,
        parent_id: null,
        body: "Legacy duplicate retained",
        body_format: "html",
        created_by: imported.author,
        status: "active",
        created_at: "2026-10-21 10:00:00",
        updated_at: "2026-10-21 10:00:00"
      })
      .executeTakeFirstOrThrow();
    await enquiries.importComment(q930.id, imported);
    await enquiries.importComment(q930.id, imported);
    await enquiries.importComment(q930.id, {
      ...imported,
      id: "JC-reply",
      content: "Updated reply",
      parentSourceId: "JC-parent"
    });
    assert.equal(
      (await repository.listComments(q930.id)).find((row) => row.body === "Updated reply")
        ?.parentId,
      Number(legacyDuplicate.insertId),
      "Replies prefer the migrated canonical parent over retained legacy duplicates"
    );
    assert.equal(
      (await repository.listComments(q930.id)).find((row) => row.id === parent.id)?.body,
      parent.body,
      "The other legacy author's row stays unchanged"
    );
    assert.equal(
      (await repository.listComments(q930.id)).find((row) => row.body === imported.content)?.id,
      Number(legacyDuplicate.insertId),
      "Legacy comment identity reuses the row with the matching source author"
    );
    await enquiries.importComment(other.id, imported);
    await enquiries.importComment(other.id, {
      ...imported,
      id: "JC-reply",
      content: "Retained reply",
      parentSourceId: "JC-parent"
    });
    await enquiries.importComment(other.id, { ...imported, author: "another-owner@example.test" });
    await enquiries.importComment(other.id, {
      ...imported,
      id: "JC-reply",
      content: "Retained reply",
      parentSourceId: "JC-parent"
    });
    const scoped = await repository.listComments(other.id);
    assert.equal(
      scoped.length,
      2,
      "Cross-enquiry source IDs and author changes do not duplicate comments"
    );
    assert.equal(
      scoped.find((row) => row.body === "Retained reply")?.parentId,
      scoped.find((row) => row.body === imported.content)?.id
    );
  }
);
