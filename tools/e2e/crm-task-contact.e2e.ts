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
  "task optional contacts persist, resolve, clear, and respect authorization",
  { timeout: 60000 },
  async (suite) => {
    assert.equal(env.NODE_ENV, "development");
    const name = `codexsun_task_contact_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const admin = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });
    const app = await createApiApp({
      appName: "codexsun-task-contact-e2e",
      cookieSecret: "codexsun-task-contact-test-secret",
      corsOrigins: [],
      environment: "development"
    });
    suite.after(async () => {
      await app.close();
      await closeCoreDatabase();
      assert.match(name, /^codexsun_task_contact_e2e_[a-f0-9]{16}$/);
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
    let denied = false;
    await taskModule.register(app, async () => ({
      database,
      actorEmail: "task@example.test",
      actorUserId: actor.id,
      canViewAll: true,
      authorize: async () => {
        if (denied) throw AppError.forbidden("Denied");
      },
      resolveContact: async (input, transaction) => {
        if (input.contactId) {
          if (!(await getActiveContactForDatabase(name, input.contactId)))
            throw AppError.validation("Select an active Core contact.");
          return input.contactId;
        }
        if (input.capturedName?.trim() || input.capturedPhone?.trim())
          return (
            await resolveOrCreateCustomerForDatabase(
              name,
              { name: input.capturedName ?? null, mobile: input.capturedPhone ?? null },
              transaction as never
            )
          ).id;
        return input.contactId;
      }
    }));
    const payload = {
      title: "Collect bill and deliver",
      description: "Collect from office",
      listInId: null,
      priorityId: priority.id,
      statusId: status.id,
      assignedUserId: actor.id,
      dueDate: null
    };
    const empty = await app.inject({ method: "POST", url: "/crm/tasks", payload });
    assert.equal(empty.statusCode, 200, empty.body);
    for (const code of ["closed", "won", "lost", "open", "hold-for-approval"]) {
      const lookup = await database
        .selectFrom("crm_enquiry_statuses")
        .select("id")
        .where("code", "=", code)
        .executeTakeFirstOrThrow();
      const fixture = await app.inject({
        method: "POST",
        url: "/crm/tasks",
        payload: { ...payload, title: `Task filter ${code}` }
      });
      assert.equal(fixture.statusCode, 200, fixture.body);
      await database
        .updateTable("crm_tasks")
        .set({ status_id: lookup.id })
        .where("id", "=", fixture.json().data.id)
        .execute();
    }
    const activeTasks = await app.inject({
      method: "GET",
      url: "/crm/tasks?filter=active&pageSize=50"
    });
    assert.equal(activeTasks.statusCode, 200, activeTasks.body);
    assert.equal(activeTasks.json().data.total, 3);
    assert.ok(
      activeTasks
        .json()
        .data.items.every(
          (task: { status: string }) => !["closed", "won", "lost"].includes(task.status)
        )
    );
    const allTasks = await app.inject({ method: "GET", url: "/crm/tasks?filter=all&pageSize=50" });
    assert.equal(allTasks.json().data.total, 6);
    assert.equal(
      allTasks
        .json()
        .data.statusCounts.reduce((sum: number, item: { count: number }) => sum + item.count, 0),
      6
    );
    assert.equal(
      activeTasks.json().data.statusCounts.find((item: { code: string }) => item.code === "closed")
        ?.count,
      1
    );
    for (const [filter, expected] of [
      ["closed", 1],
      ["hold", 1],
      ["pending-group", 1],
      ["other", 0]
    ] as const) {
      const filtered = await app.inject({ method: "GET", url: `/crm/tasks?filter=${filter}` });
      assert.equal(filtered.statusCode, 200, filtered.body);
      assert.equal(filtered.json().data.total, expected, filter);
    }

    assert.equal(empty.json().data.contactId, null);
    const customer = await resolveOrCreateCustomerForDatabase(name, {
      name: "Bill recipient",
      mobile: "9876543210"
    });
    const selected = await app.inject({
      method: "POST",
      url: "/crm/tasks",
      payload: { ...payload, contactId: customer.id }
    });
    assert.equal(selected.statusCode, 200, selected.body);
    const id = selected.json().data.id;
    const firstComment = await app.inject({
      method: "POST",
      url: `/crm/tasks/${id}/comments`,
      payload: { body: "Collect the bill" }
    });
    assert.equal(firstComment.statusCode, 200, firstComment.body);
    assert.equal(firstComment.json().data.parentId, null);
    const reply = await app.inject({
      method: "POST",
      url: `/crm/tasks/${id}/comments`,
      payload: { body: "I will collect it", parentId: firstComment.json().data.id }
    });
    assert.equal(reply.statusCode, 200, reply.body);
    assert.equal(reply.json().data.parentId, firstComment.json().data.id);
    const nestedReply = await app.inject({
      method: "POST",
      url: `/crm/tasks/${id}/comments`,
      payload: { body: "Nested replies are not supported", parentId: reply.json().data.id }
    });
    assert.equal(nestedReply.statusCode, 400, nestedReply.body);
    const taskComments = await app.inject({ method: "GET", url: `/crm/tasks/${id}/comments` });
    assert.equal(taskComments.statusCode, 200, taskComments.body);
    assert.deepEqual(
      taskComments.json().data.map((item: { parentId: number | null }) => item.parentId),
      [null, firstComment.json().data.id]
    );
    const customerTasks = await app.inject({
      method: "GET",
      url: `/crm/tasks?contactId=${customer.id}&filter=all`
    });
    assert.equal(customerTasks.statusCode, 200, customerTasks.body);
    assert.equal(customerTasks.json().data.total, 1);
    assert.equal(customerTasks.json().data.items[0].id, id);
    const unrelatedTasks = await app.inject({
      method: "GET",
      url: "/crm/tasks?contactId=99999999&filter=all"
    });
    assert.equal(unrelatedTasks.json().data.total, 0);

    const load = async () =>
      (await app.inject({ method: "GET", url: `/crm/tasks/${id}` })).json().data;
    assert.equal((await load()).contactName, "Bill recipient");
    assert.equal((await load()).contactPhone, "9876543210");
    const preserve = await app.inject({
      method: "PUT",
      url: `/crm/tasks/${id}`,
      payload: { ...payload, title: "Updated instructions" }
    });
    assert.equal(preserve.statusCode, 200, preserve.body);
    assert.equal((await load()).contactId, customer.id);
    const clear = await app.inject({
      method: "PUT",
      url: `/crm/tasks/${id}`,
      payload: { ...payload, contactId: null, capturedName: null, capturedPhone: null }
    });
    assert.equal(clear.statusCode, 200, clear.body);
    assert.equal((await load()).contactId, null);
    const inline = await app.inject({
      method: "POST",
      url: "/crm/tasks",
      payload: {
        ...payload,
        contactId: null,
        capturedName: "New task recipient",
        capturedPhone: "9123456780"
      }
    });
    assert.equal(inline.statusCode, 200, inline.body);
    assert.ok(inline.json().data.contactId);
    assert.equal(inline.json().data.contactName, "New task recipient");
    const stored = await database
      .selectFrom("crm_tasks")
      .select("contact_id")
      .where("id", "=", inline.json().data.id)
      .executeTakeFirstOrThrow();
    assert.equal(stored.contact_id, inline.json().data.contactId);
    for (const contactId of [99999999]) {
      const bad = await app.inject({
        method: "POST",
        url: "/crm/tasks",
        payload: { ...payload, contactId }
      });
      assert.equal(bad.statusCode, 400, bad.body);
    }
    await sql`UPDATE core_contacts SET status='suspend' WHERE id=${customer.id}`.execute(database);
    const inactive = await app.inject({
      method: "POST",
      url: "/crm/tasks",
      payload: { ...payload, contactId: customer.id }
    });
    assert.equal(inactive.statusCode, 400, inactive.body);
    const malformed = await app.inject({
      method: "POST",
      url: "/crm/tasks",
      payload: { ...payload, capturedPhone: "123" }
    });
    assert.equal(malformed.statusCode, 400, malformed.body);
    denied = true;
    const forbidden = await app.inject({
      method: "POST",
      url: "/crm/tasks",
      payload: { ...payload, capturedName: "Must not create", capturedPhone: "9234567890" }
    });
    assert.equal(forbidden.statusCode, 403, forbidden.body);
    const noContact = await sql<{
      total: number;
    }>`SELECT COUNT(*) AS total FROM core_contacts WHERE name='Must not create'`.execute(database);
    assert.equal(Number(noContact.rows[0]?.total), 0);
  }
);
