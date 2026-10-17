import {
  migrateChatModule,
  writeWorkMessage,
  ChatRepository
} from "../../apps/chat/api/src/index.js";
import {
  workReportModule,
  recordWorkEvent,
  type WorkReportContext,
  type WorkReportDatabase
} from "../../apps/crm/api/src/index.js";
import type { Transaction } from "kysely";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createConnection } from "mysql2/promise";
import { createApiApp } from "@codexsun/framework/api";
import { AppError } from "@codexsun/framework/errors";
import { sql } from "kysely";
import { env } from "../../apps/platform/api/src/env.js";
import {
  migrateCoreTenantDatabase,
  seedCoreTenantDatabase,
  getCoreDatabase,
  closeCoreDatabase
} from "../../apps/core/api/src/database/core-database.js";
import {
  getActiveContactForDatabase,
  resolveOrCreateCustomerForDatabase
} from "../../apps/core/api/src/modules/master/contact/index.js";
import { migrateTenantRuntimeModule } from "../../apps/platform/api/src/modules/tenant/tenant.migration.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import { seedStatusMaster } from "../../apps/crm/api/src/modules/status/index.js";
import { seedPriorityMaster } from "../../apps/crm/api/src/modules/priority/index.js";
import { taskModule, type TaskContext } from "../../apps/crm/api/src/modules/task/index.js";

test(
  "admin assignment, user GPS actions, chat delivery, retries, and isolation",
  { timeout: 60000 },
  async (suite) => {
    assert.equal(env.NODE_ENV, "development");
    const name = `codexsun_work_reports_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const admin = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });
    const app = await createApiApp({
      appName: "codexsun-work-reports-e2e",
      cookieSecret: "codexsun-task-contact-test-secret",
      corsOrigins: [],
      environment: "development"
    });
    suite.after(async () => {
      await app.close();
      await closeCoreDatabase();
      assert.match(name, /^codexsun_work_reports_e2e_[a-f0-9]{16}$/);
      try {
        await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      } finally {
        await admin.end();
      }
    });
    await migrateCoreTenantDatabase(name);
    await seedCoreTenantDatabase(name);
    const database = getCoreDatabase(name) as unknown as TaskContext["database"];
    await migrateTenantRuntimeModule(database as never);
    await migrateCrmTenantDatabase(database as never);
    await seedStatusMaster(database as never);
    await seedPriorityMaster(database as never);
    await sql`INSERT INTO app_users (uuid,name,email,password_hash,status) VALUES ('testuser','Task tester','task@example.test','test-only','active')`.execute(
      database
    );
    const actor = await database.selectFrom("app_users").select("id").executeTakeFirstOrThrow();
    const status = await database
      .selectFrom("crm_enquiry_statuses")
      .select("id")
      .where("code", "=", "new")
      .executeTakeFirstOrThrow();
    const priority = await database
      .selectFrom("crm_enquiry_priorities")
      .select("id")
      .where("code", "=", "normal")
      .executeTakeFirstOrThrow();

    await migrateChatModule(database as never);
    await sql`INSERT INTO app_users (uuid,name,email,password_hash,status) VALUES ('fieldusr','Field user','field@example.test','test-only','active'), ('outsider','Other user','other@example.test','test-only','active')`.execute(
      database
    );
    const field = await database
      .selectFrom("app_users")
      .select("id")
      .where("email", "=", "field@example.test")
      .executeTakeFirstOrThrow();
    let actorEmail = "task@example.test";
    let actorId = actor.id;
    let manager = true;
    const authorize = async (permission: string) => {
      if (
        !manager &&
        (permission.endsWith("view-all") ||
          permission.endsWith("create") ||
          (permission.endsWith("update") && permission.startsWith("crm.task")))
      )
        throw AppError.forbidden("Denied");
    };
    const workContext = (): WorkReportContext => ({
      database: database as never,
      actorEmail,
      actorUserId: actorId,
      authorize,
      sendMessage: async (trx, message) =>
        writeWorkMessage(trx as never, { ...message, actorEmail, companyId: 1 })
    });
    await taskModule.register(app, async () => ({
      database,
      actorEmail,
      actorUserId: actorId,
      canViewAll: manager,
      authorize,
      workEvent: async (trx, taskId, action, body) => {
        await recordWorkEvent(
          workContext(),
          trx as unknown as Transaction<WorkReportDatabase>,
          { taskId, enquiryId: null },
          action,
          body
        );
      }
    }));
    await workReportModule.register(app, async () => workContext());
    const send = async (
      method: "GET" | "POST",
      url: string,
      payload?: unknown,
      statusCode = 200
    ) => {
      const response = await app.inject({
        method,
        url,
        ...(payload === undefined ? {} : { payload })
      });
      assert.equal(response.statusCode, statusCode, response.body);
      return response.json().data;
    };
    const task = await send("POST", "/crm/tasks", {
      title: "Deliver office bill",
      description: "Deliver to linked customer",
      listInId: null,
      priorityId: priority.id,
      statusId: status.id,
      assignedUserId: field.id,
      dueDate: null
    });
    const events = await send("GET", `/crm/work-reports?taskId=${task.id}`);
    assert.equal(events.length, 1);
    assert.equal(events[0].action, "assigned");
    const chat = new ChatRepository();
    const chatContext = () => ({
      database: database as never,
      actorEmail,
      companyId: 1,
      tenantId: "e2e",
      tenantDatabase: name,
      authorize
    });
    actorEmail = "field@example.test";
    actorId = field.id;
    manager = false;
    const conversations = await chat.listChannels(chatContext(), {});
    assert.equal(conversations.length, 1);
    const detail = await chat.channelDetail(chatContext(), conversations[0]!.uuid);
    assert.ok(detail.members.some((member) => member.userEmail === "task@example.test"));
    const payload = {
      enquiryId: null,
      taskId: task.id,
      action: "check-in",
      body: "Arrived at office",
      requestId: "codexsun-checkin-01",
      latitude: 13.082700004,
      longitude: 80.2707,
      accuracyMeters: 7.50000003,
      capturedAt: new Date().toISOString()
    };
    await send(
      "POST",
      "/crm/work-reports",
      { ...payload, action: "check-out", requestId: "codexsun-checkout-before" },
      409
    );
    const checkin = await send("POST", "/crm/work-reports", payload);
    const retry = await send("POST", "/crm/work-reports", payload);
    assert.equal(retry.uuid, checkin.uuid);
    await send(
      "POST",
      "/crm/work-reports",
      { ...payload, requestId: "codexsun-double-checkin" },
      409
    );
    await send("POST", "/crm/work-reports", { ...payload, body: "Different retry" }, 409);
    await send(
      "POST",
      "/crm/work-reports",
      { ...payload, latitude: null, requestId: "codexsun-no-gps" },
      400
    );
    const report = await send("POST", "/crm/work-reports", {
      enquiryId: null,
      taskId: task.id,
      action: "report",
      body: "Bill collected",
      requestId: "codexsun-report-01"
    });
    assert.equal(report.created_by, actorEmail);
    const checkout = await send("POST", "/crm/work-reports", {
      ...payload,
      action: "check-out",
      body: "Delivered bill",
      requestId: "codexsun-checkout-01"
    });
    assert.equal(Number(checkout.latitude), 13.0827);
    assert.equal(Number(checkout.longitude), 80.2707);
    const userChannels = await chat.listChannels(chatContext(), {});
    const userChat = await chat.channelDetail(chatContext(), userChannels[0]!.uuid);
    assert.equal(userChat.messages.length, 4);
    assert.ok(
      userChat.messages.some(
        (message) => message.body.includes("Delivered bill") && message.body.includes("GPS:")
      )
    );
    actorEmail = "other@example.test";
    actorId = (
      await database
        .selectFrom("app_users")
        .select("id")
        .where("email", "=", actorEmail)
        .executeTakeFirstOrThrow()
    ).id;
    await send("GET", `/crm/work-reports?taskId=${task.id}`, undefined, 403);
    await send("POST", "/crm/work-reports", { ...payload, requestId: "codexsun-unrelated" }, 403);
    assert.equal((await chat.listChannels(chatContext(), {})).length, 0);
    actorEmail = "task@example.test";
    actorId = actor.id;
    manager = true;
    const adminReports = await send("GET", `/crm/work-reports?taskId=${task.id}`);
    assert.equal(adminReports.length, 4);
    assert.ok(adminReports.some((row: { uuid: string }) => row.uuid === checkout.uuid));
    await sql`INSERT INTO crm_enquiries (title,description,enquired_at,created_by,status_id,priority_id,assigned_user_id,enquiry_no) VALUES ('Site visit','Visit customer',UTC_TIMESTAMP(),'task@example.test',${status.id},${priority.id},${field.id},1)`.execute(
      database
    );
    const enquiry = await sql<{
      id: number;
    }>`SELECT id FROM crm_enquiries WHERE enquiry_no=1`.execute(database);
    actorEmail = "field@example.test";
    actorId = field.id;
    manager = false;
    const enquiryId = enquiry.rows[0]!.id;
    const arrival = await send("POST", "/crm/work-reports", {
      ...payload,
      enquiryId,
      taskId: null,
      requestId: "codexsun-enquiry-arrival"
    });
    assert.equal(arrival.enquiry_id, enquiryId);
    await send("POST", "/crm/work-reports", {
      ...payload,
      enquiryId,
      taskId: null,
      action: "check-out",
      requestId: "codexsun-enquiry-departure"
    });
    await send("GET", "/crm/work-reports?taskId=99999", undefined, 404);
    await send("GET", `/crm/work-reports?taskId=${task.id}&enquiryId=${enquiryId}`, undefined, 400);
    // A self-created record has no other participant: route its update to active administrators.
    await sql`INSERT INTO app_roles (uuid,\`key\`,label,status) VALUES ('roleadmn','admin','Administrator','active') ON DUPLICATE KEY UPDATE status='active'`.execute(
      database
    );
    await sql`INSERT INTO app_user_roles (uuid,user_id,role_id,status) SELECT 'adminlnk',${actor.id},id,'active' FROM app_roles WHERE \`key\`='admin' ON DUPLICATE KEY UPDATE status='active'`.execute(
      database
    );
    await sql`UPDATE crm_enquiries SET created_by='field@example.test' WHERE id=${enquiryId}`.execute(
      database
    );
    await send("POST", "/crm/work-reports", {
      enquiryId,
      taskId: null,
      action: "report",
      body: "Needs administrator review",
      requestId: "codexsun-admin-fallback"
    });
    const fallbackChannels = await chat.listChannels(chatContext(), {});
    const fallback = await chat.channelDetail(
      chatContext(),
      fallbackChannels.find((channel) => channel.name.includes("Site visit"))!.uuid
    );
    assert.ok(
      fallback.members.some((member) => member.userEmail === "task@example.test"),
      "fallback delivers to admin"
    );
    // A different company cannot resolve the conversation even with the same actor.
    assert.equal((await chat.listChannels({ ...chatContext(), companyId: 2 }, {})).length, 0);
    actorEmail = "other@example.test";
    actorId = (
      await database
        .selectFrom("app_users")
        .select("id")
        .where("email", "=", actorEmail)
        .executeTakeFirstOrThrow()
    ).id;
    await assert.rejects(chat.channelDetail(chatContext(), fallback.channel.uuid));
    await assert.rejects(chat.requireMessage(chatContext(), fallback.messages[0]!.uuid));
    actorEmail = "field@example.test";
    actorId = field.id;
    // Failed chat delivery must roll back the action report as well.
    const before = (await send("GET", `/crm/work-reports?enquiryId=${enquiryId}`)).length;
    const failing = workContext();
    failing.sendMessage = async () => {
      throw new Error("Chat unavailable");
    };
    const { WorkReportService } =
      await import("../../apps/crm/api/src/modules/work-report/work-report.service.js");
    await assert.rejects(
      new WorkReportService(failing).create({
        ...payload,
        enquiryId,
        taskId: null,
        action: "report",
        requestId: "codexsun-rollback",
        body: "Must roll back"
      })
    );
    assert.equal((await send("GET", `/crm/work-reports?enquiryId=${enquiryId}`)).length, before);
  }
);
