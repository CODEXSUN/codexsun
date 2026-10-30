import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { Kysely, MysqlDialect, sql } from "kysely";
import Fastify from "fastify";
import { createPool } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../../apps/platform/api/src/env.js";
import {
  migrateSchedulerModule,
  schedulerMigrationBatch
} from "../../apps/crm/api/src/modules/scheduler/scheduler.migration.js";
import { SchedulerRepository } from "../../apps/crm/api/src/modules/scheduler/scheduler.repository.js";
import { registerSchedulerRoutes } from "../../apps/crm/api/src/modules/scheduler/scheduler.routes.js";
import type { SchedulerDatabase } from "../../apps/crm/api/src/modules/scheduler/scheduler.types.js";

assert.equal(env.NODE_ENV, "development", "This suite uses only the local development database.");

test("schedule notes migration preserves old text and new writes use one time", async (suite) => {
  const name = `codexsun_crm_schedules_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
  const admin = await createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD
  });
  await admin.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  const database = new Kysely<SchedulerDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: name,
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        timezone: "Z",
        connectionLimit: 2
      })
    })
  });
  suite.after(async () => {
    await database.destroy();
    assert.match(name, /^codexsun_crm_schedules_e2e_[a-f0-9]{16}$/u);
    await admin.query(`DROP DATABASE \`${name}\``);
    await admin.end();
  });

  await sql`CREATE TABLE app_users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active'
  ) ENGINE=InnoDB`.execute(database);
  await sql`INSERT INTO app_users (name,email) VALUES ('Scheduler E2E','scheduler@local.invalid')`.execute(
    database
  );
  await sql`CREATE TABLE crm_enquiries (
    id INT NOT NULL PRIMARY KEY,
    enquiry_no INT NOT NULL,
    title VARCHAR(191) NOT NULL,
    status VARCHAR(24) NOT NULL,
    created_by VARCHAR(191) NOT NULL,
    assigned_user_id INT NULL
  ) ENGINE=InnoDB`.execute(database);
  await sql`INSERT INTO crm_enquiries
    (id,enquiry_no,title,status,created_by,assigned_user_id)
    VALUES (41,41,'Installation','open','scheduler@local.invalid',1)`.execute(database);
  const initial = schedulerMigrationBatch.steps[0];
  assert.ok(initial);
  await initial.up(database);
  await sql`INSERT INTO crm_schedules
    (title,details,source_type,source_id,source_label,scheduled_at,reminder_at,
      status,assigned_user_id,created_by)
    VALUES ('Call customer','Confirm delivery time','enquiry',41,'Enquiry #41',
      '2026-10-21 10:00:00','2026-10-21 09:00:00','scheduled',1,'scheduler@local.invalid')`.execute(
    database
  );

  const migration = await migrateSchedulerModule(database);
  assert.deepEqual(migration.applied, ["crm.scheduler.v1", "crm.scheduler.notes-v2"]);
  const repository = new SchedulerRepository(database);
  const scope = { email: "scheduler@local.invalid", userId: 1, viewAll: false };
  const existing = await repository.list(scope, {
    view: "schedules",
    sourceType: "enquiry",
    sourceId: 41
  });
  assert.equal(existing[0]?.notes, "Call customer\nConfirm delivery time");

  const scheduledAt = "2026-10-22T10:30:00.000Z";
  const created = await repository.create(
    {
      notes: "Visit customer and check the installation",
      sourceType: "enquiry",
      sourceId: 41,
      scheduledAt
    },
    "Enquiry #41",
    "scheduler@local.invalid",
    1
  );
  assert.equal(created?.notes, "Visit customer and check the installation");
  const times = await sql<{ scheduledAt: Date | string; reminderAt: Date | string }>`SELECT
    scheduled_at AS scheduledAt, reminder_at AS reminderAt FROM crm_schedules WHERE id=${created?.id}`.execute(
    database
  );
  assert.equal(String(times.rows[0]?.scheduledAt), String(times.rows[0]?.reminderAt));

  const app = Fastify();
  suite.after(() => app.close());
  registerSchedulerRoutes(app, async () => ({
    database,
    actorEmail: "scheduler@local.invalid",
    actorUserId: 1,
    authorize: async () => {},
    hasPermission: async () => false
  }));
  const canonical = await app.inject({
    method: "POST",
    url: "/crm/schedules",
    payload: { notes: "Inspect the installation", sourceType: "enquiry", sourceId: 41, scheduledAt }
  });
  assert.equal(canonical.statusCode, 200);
  assert.equal(canonical.json().data.notes, "Inspect the installation");
  assert.equal(canonical.json().data.reminderAt, scheduledAt);
  const legacy = await app.inject({
    method: "POST",
    url: "/crm/schedules",
    payload: {
      title: "Call customer",
      details: "Confirm delivery",
      sourceType: "enquiry",
      sourceId: 41,
      scheduledAt,
      reminderAt: scheduledAt
    }
  });
  assert.equal(legacy.statusCode, 200);
  assert.equal(legacy.json().data.notes, "Call customer\nConfirm delivery");
  assert.equal(legacy.json().data.title, "Call customer\nConfirm delivery");
  const repeat = await migrateSchedulerModule(database);
  assert.deepEqual(repeat.skipped, ["crm.scheduler.v1", "crm.scheduler.notes-v2"]);
});
