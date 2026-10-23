import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createApiApp } from "@codexsun/framework/api";
import { sql } from "kysely";
import { env } from "../../apps/platform/api/src/env.js";
import { TenantRepository } from "../../apps/platform/api/src/modules/tenant/tenant.repository.js";
import {
  getTenantDatabase,
  closeAllTenantDatabases
} from "../../apps/platform/api/src/database/tenant-database.js";
import { closePlatformDatabase } from "../../apps/platform/api/src/database/platform-database.js";
import { tenantAccessContext } from "../../apps/platform/api/src/auth/tenant-access-context.js";
import { signAuthToken } from "../../apps/platform/api/src/auth/jwt.js";
import { QueueManagerService } from "../../apps/platform/api/src/modules/queue-manager/queue-manager.service.js";
import { registerQueueJobProcessor } from "../../apps/platform/api/src/modules/queue-manager/queue-manager.worker.js";
import { enquiryModule } from "../../apps/crm/api/src/modules/enquiry/enquiry.module.js";
import { EnquirySyncRepository } from "../../apps/crm/api/src/modules/enquiry/enquiry.sync.repository.js";
import {
  FrappeConnectionAccess,
  requestFrappe,
  type FrappeDatabase
} from "../../apps/frappe/api/src/modules/connection/index.js";
import { listEnquiryJobComments } from "../../apps/frappe/api/src/modules/connection/connection.job-comments.js";
import { processLocalEnquirySync } from "../../apps/frappe/api/src/modules/enquiry-sync/enquiry-sync.outbound.js";
import {
  closeCoreDatabase,
  getActiveContactForDatabase,
  resolveOrCreateCustomerForDatabase
} from "../../apps/core/api/src/index.js";

test(
  "live Vijay enquiry POST, durable queue, Job Comments, and lost-response retry",
  {
    skip: process.env.CODEXSUN_FRAPPE_LIVE_ENQUIRY_WRITE !== "1",
    timeout: 180_000
  },
  async (suite) => {
    suite.after(async () => {
      await closeCoreDatabase();
      await closeAllTenantDatabases();
      await closePlatformDatabase();
    });
    assert.equal(env.NODE_ENV, "development");
    const tenant = await new TenantRepository().findByIdOrCode(
      process.env.CODEXSUN_FRAPPE_LIVE_TENANT || "CODEXSUN"
    );
    assert(tenant?.status === "active");
    const database = getTenantDatabase(tenant);
    const db = database as unknown as import("kysely").Kysely<FrappeDatabase>;
    const defaults = { baseUrl: "", apiKey: "", apiSecret: "", enabled: false };
    const queue = new QueueManagerService();
    const jobs: number[] = [];
    const marker = `CODEXSUN queued live ${randomUUID()}`;
    const settings = await new FrappeConnectionAccess(
      db,
      env.JWT_SECRET,
      defaults
    ).exportCredentials();
    assert(settings);
    assert.equal(new URL(settings.baseUrl).hostname, "logicx.tmnext.in");
    const identity = await requestFrappe<{ message: string }>(
      "/api/method/frappe.auth.get_logged_user",
      "GET",
      settings
    );
    assert.equal(identity.message, "vijay@techmedia.in");
    assert.equal(
      await queue.currentBackend(),
      "database",
      "This targeted consumer must not compete with a Redis worker."
    );
    const user = await database
      .selectFrom("app_users")
      .select(["id", "email"])
      .where("email", "=", identity.message)
      .where("status", "=", "active")
      .executeTakeFirstOrThrow();
    const association = await sql<{
      local_contact_id: number;
      remote_name: string;
      primary_phone: string;
    }>`SELECT i.local_contact_id,i.remote_name,c.primary_phone FROM frappe_contact_customer_identity i JOIN core_contacts c ON c.id=i.local_contact_id WHERE c.status='active' AND c.deleted_at IS NULL LIMIT 1`.execute(
      database
    );
    const customer = association.rows[0];
    assert(customer);
    const status = await sql<{
      id: number;
    }>`SELECT id FROM crm_enquiry_statuses WHERE code='new' AND status='active' LIMIT 1`.execute(
      database
    );
    const priority = await sql<{
      id: number;
    }>`SELECT id FROM crm_enquiry_priorities WHERE code='normal' AND status='active' LIMIT 1`.execute(
      database
    );
    const token = signAuthToken({
      email: user.email,
      userId: String(user.id),
      userType: "tenant",
      tenantId: String(tenant.id),
      tenantUuid: tenant.uuid,
      tenantCode: tenant.tenantCode,
      tenantDbName: tenant.dbName
    });
    const headers = {
      authorization: `Bearer ${token}`,
      "x-tenant-db": tenant.dbName,
      "x-tenant-id": String(tenant.id)
    };
    const app = await createApiApp({
      appName: "CODEXSUN Frappe live enquiry test",
      environment: "development",
      cookieSecret: env.JWT_SECRET,
      corsOrigins: []
    });
    const sync = new EnquirySyncRepository(database as never);
    async function postEvent(eventId: number) {
      const event = await sync.getEvent(eventId);
      assert(event);
      const job = await queue.enqueue({
        actorEmail: user.email,
        tenantId: String(tenant!.id),
        jobName: "crm.enquiry.frappe-sync",
        queueName: "crm",
        sourceModule: "crm.enquiry",
        correlationId: marker,
        idempotencyKey: `crm-enquiry-sync:${tenant!.id}:${eventId}:${event.attempts}`,
        maxAttempts: 6,
        // Keep unrelated running development workers away from these explicit test deliveries.
        availableAt: new Date(Date.now() + 3_600_000).toISOString(),
        payload: { eventId, tenantDatabase: tenant!.dbName }
      });
      assert(job);
      if (!jobs.includes(job.id)) jobs.push(job.id);
      return job;
    }
    registerQueueJobProcessor("crm.enquiry.frappe-sync", async (job) => {
      assert.equal(job.tenantId, String(tenant!.id));
      assert.equal(job.payload.tenantDatabase, tenant!.dbName);
      assert.equal(job.actorEmail, user.email);
      return processLocalEnquirySync(db, Number(job.payload.eventId), env.JWT_SECRET, defaults);
    });
    enquiryModule.register(app, async (request) => {
      const context = tenantAccessContext(request);
      assert.equal(context.actorEmail, user.email);
      await context.authorize(
        request.method === "GET"
          ? "crm.enquiry.view"
          : request.url.endsWith("/comments")
            ? "crm.enquiry.update"
            : "crm.enquiry.create"
      );
      await context.authorize("frappe.connection.manage");
      await context.authorize("crm.enquiry.frappe-sync.view");
      return {
        database: database as never,
        actorEmail: user.email,
        actorUserId: user.id,
        canViewAll: false,
        canViewFrappeSync: true,
        relations: {
          contact: (id) => getActiveContactForDatabase(tenant!.dbName, id),
          resolveOrCreateCustomer: (input, trx) =>
            resolveOrCreateCustomerForDatabase(tenant!.dbName, input, trx as never),
          user: async (id) =>
            (await database
              .selectFrom("app_users")
              .select("name")
              .where("id", "=", id)
              .where("status", "=", "active")
              .executeTakeFirst()) ?? null,
          listIn: async () => null,
          status: async (id) =>
            await sql<any>`SELECT name,code FROM crm_enquiry_statuses WHERE id=${id} AND status='active'`
              .execute(database)
              .then((r) => r.rows[0] ?? null),
          priority: async (id) =>
            await sql<any>`SELECT name FROM crm_enquiry_priorities WHERE id=${id} AND status='active'`
              .execute(database)
              .then((r) => r.rows[0] ?? null)
        },
        listUsers: async () => [],
        dispatchFrappeSync: async (id) => {
          await postEvent(id);
        }
      };
    });
    const originalFetch = globalThis.fetch;
    let enquiryId = 0;
    try {
      const created = await app.inject({
        method: "POST",
        url: "/crm/enquiries",
        headers,
        payload: {
          title: marker,
          description: marker,
          contactId: customer.local_contact_id,
          capturedName: null,
          capturedEmail: null,
          capturedPhone: customer.primary_phone,
          source: "manual",
          sourceReference: null,
          listInId: null,
          statusId: String(status.rows[0]!.id),
          priorityId: String(priority.rows[0]!.id),
          assignedUserId: null,
          enquiredAt: new Date().toISOString(),
          dueDate: null,
          closedReason: null
        }
      });
      assert.equal(created.statusCode, 200, created.body);
      enquiryId = Number(created.json().data.id);
      const event = (await sync.listForEnquiry(enquiryId)).find(
        (e) => e.eventType === "enquiry-upsert"
      );
      assert(event);
      assert.equal(event.status, "pending");
      assert.equal(jobs.length, 2);
      const earlyComment = await queue.runJob(jobs[1]!);
      assert.equal(earlyComment?.result.status, "retry");
      const initialEventId = Number(earlyComment.result.eventId);
      const delivered = await queue.runJob(jobs[0]!);
      assert.equal(delivered?.status, "completed");
      assert.equal(delivered.result.status, "synced");
      const remoteName = String(delivered.result.remoteName);
      const initial = await queue.runJob((await postEvent(initialEventId)).id);
      assert.equal(initial?.result.status, "synced");
      const remote = await requestFrappe<{
        data: { customer: string; mobile_customer: string; mobile: string };
      }>(`/api/resource/Enquiry/${remoteName}`, "GET", settings);
      assert.equal(remote.data.customer, customer.remote_name);
      assert(remote.data.mobile_customer);
      const body = {
        body: marker + " parent",
        bodyFormat: "plain",
        requestId: randomUUID(),
        parentId: null
      };
      const comment = await app.inject({
        method: "POST",
        url: `/crm/enquiries/${enquiryId}/comments`,
        headers,
        payload: body
      });
      assert.equal(comment.statusCode, 200, comment.body);
      const repeated = await app.inject({
        method: "POST",
        url: `/crm/mobile/enquiries/${enquiryId}/comments`,
        headers,
        payload: body
      });
      assert.equal(repeated.statusCode, 200, repeated.body);
      assert.equal(repeated.json().data.id, comment.json().data.id);
      const commentId = Number(comment.json().data.id);
      const commentEvent = await sync.commentSyncEvent(commentId);
      assert(commentEvent);
      let lost = false;
      globalThis.fetch = async (input, init) => {
        const response = await originalFetch(input, init);
        if (
          !lost &&
          init?.method === "POST" &&
          new URL(String(input)).pathname === "/api/v2/document/Job%20Comments" &&
          response.ok
        ) {
          lost = true;
          throw new Error("Simulated response lost after Frappe committed Job Comments");
        }
        return response;
      };
      const commentJob = await postEvent(commentEvent.id);
      try {
        await queue.runJob(commentJob.id);
      } finally {
        globalThis.fetch = originalFetch;
      }
      assert(lost, "Comment POST was not exercised");
      const retry = await sync.getEvent(commentEvent.id);
      assert.equal(retry?.status, "retry");
      const retried = await queue.runJob((await postEvent(commentEvent.id)).id);
      assert.equal(retried?.result.status, "synced");
      const parentRemote = String(retried.result.remoteName);
      const replay = await processLocalEnquirySync(db, commentEvent.id, env.JWT_SECRET, defaults);
      assert.equal(replay.remoteName, parentRemote);
      const reply = await app.inject({
        method: "POST",
        url: `/crm/enquiries/${enquiryId}/comments`,
        headers,
        payload: {
          body: marker + " reply",
          bodyFormat: "plain",
          requestId: randomUUID(),
          parentId: String(commentId)
        }
      });
      assert.equal(reply.statusCode, 200, reply.body);
      const replyEvent = await sync.commentSyncEvent(Number(reply.json().data.id));
      assert(replyEvent);
      const replyDelivery = await queue.runJob((await postEvent(replyEvent.id)).id);
      assert.equal(replyDelivery?.result.status, "synced");
      const comments = await listEnquiryJobComments(settings, [remoteName]);
      assert.equal(comments.length, 3);
      assert.equal(
        comments.find((c) => c.name === replyDelivery.result.remoteName)?.parent_comment,
        parentRemote
      );
      const existing = await requestFrappe<{ data: unknown[] }>(
        `/api/resource/Enquiry?${new URLSearchParams({ fields: JSON.stringify(["name"]), filters: JSON.stringify([["title", "=", marker]]) })}`,
        "GET",
        settings
      );
      assert.equal(existing.data.length, 1);
      const local = await sql<{
        count: number;
      }>`SELECT COUNT(*) AS count FROM crm_enquiry_comments WHERE enquiry_id=${enquiryId}`.execute(
        database
      );
      assert.equal(Number(local.rows[0]!.count), 3);
      console.log(
        JSON.stringify({
          actor: user.email,
          localEnquiryId: enquiryId,
          remoteEnquiry: remoteName,
          customer: remote.data.customer,
          mobileCustomer: remote.data.mobile_customer,
          queueJobs: jobs,
          parentRemote,
          replyRemote: replyDelivery.result.remoteName,
          remoteComments: comments.length,
          localComments: Number(local.rows[0]!.count),
          lostResponseRecovered: true,
          retainedMarkedFixtures: true
        })
      );
    } finally {
      globalThis.fetch = originalFetch;
      await app.close();
      await closeCoreDatabase();
      await closeAllTenantDatabases();
      await closePlatformDatabase();
    }
  }
);
