import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { createConnection } from "mysql2/promise";
import Fastify from "fastify";
import { z } from "zod";
import { loadEnv } from "@codexsun/framework/env";
import { AppError } from "@codexsun/framework/errors";
import { runMigrationBatch } from "@codexsun/framework/db";
import { requirementsMigrationBatch } from "./modules/requirements/index.js";
import { devicesMigrationBatch } from "./modules/devices/index.js";
import {
  migrateCodexsunDatabase,
  seedCodexsunPermissions,
  registerCodexsunApi,
  type CodexsunDatabase
} from "./index.js";

const env = loadEnv(
  z.object({
    DB_HOST: z.enum(["127.0.0.1", "localhost"]),
    DB_PORT: z.coerce.number().int(),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),
    DEFAULT_TENANT_DB_NAME: z.string().regex(/^[A-Za-z0-9_]+$/),
    NODE_ENV: z
      .string()
      .refine((value) => value !== "production")
      .optional()
  })
);
const connection = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  timezone: "Z"
};
const admin = await createConnection(connection);
const created: string[] = [];
const databases: Kysely<CodexsunDatabase>[] = [];
const apps: ReturnType<typeof Fastify>[] = [];
function connect(name: string) {
  assert.match(name, /^codexsun_test_agent_[a-f0-9]{12}$/);
  const database = new Kysely<CodexsunDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({ ...connection, database: name, connectionLimit: 2 })
    })
  });
  databases.push(database);
  return database;
}
async function fixture(upgrade = false) {
  const name = `codexsun_test_agent_${randomBytes(6).toString("hex")}`;
  assert.match(name, /^codexsun_test_agent_[a-f0-9]{12}$/);
  await admin.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  created.push(name);
  for (const table of ["app_roles", "app_permissions", "app_role_permissions"]) {
    await admin.query(
      `CREATE TABLE \`${name}\`.\`${table}\` LIKE \`${env.DEFAULT_TENANT_DB_NAME}\`.\`${table}\``
    );
  }
  await admin.query(
    `INSERT INTO \`${name}\`.app_roles (uuid,\`key\`,label,status) VALUES ('aabbccdd','admin','Admin','active')`
  );
  const database = connect(name);
  if (upgrade) {
    await runMigrationBatch(database, {
      ...requirementsMigrationBatch,
      steps: requirementsMigrationBatch.steps.slice(0, 1)
    });
    await runMigrationBatch(database, {
      ...devicesMigrationBatch,
      steps: devicesMigrationBatch.steps.slice(0, 1)
    });
    await sql
      .raw(
        "ALTER TABLE codexsun_requirement_activity DROP COLUMN status,DROP COLUMN created_by,DROP COLUMN updated_at"
      )
      .execute(database);
    await sql
      .raw(
        "ALTER TABLE codexsun_device_activity DROP COLUMN status,DROP COLUMN created_by,DROP COLUMN updated_at"
      )
      .execute(database);
    await sql`INSERT INTO codexsun_devices (uuid,device_key,label,kind,created_by) VALUES ('55667788','upgrade_device','Upgrade device','web','upgrade@example.test')`.execute(
      database
    );
    await sql`INSERT INTO codexsun_device_activity (uuid,device_uuid,action,actor_email) VALUES ('66778899','55667788','created','upgrade@example.test')`.execute(
      database
    );
  }
  await migrateCodexsunDatabase(database);
  await migrateCodexsunDatabase(database);
  if (upgrade) {
    const preserved = await sql<{
      createdBy: string;
      status: string;
    }>`SELECT created_by createdBy,status FROM codexsun_device_activity WHERE uuid='66778899'`.execute(
      database
    );
    assert.deepEqual(preserved.rows, [{ createdBy: "upgrade@example.test", status: "active" }]);
  }
  const ledger = await sql<{
    count: number;
  }>`SELECT COUNT(*) count FROM migration_schema WHERE status='applied'`.execute(database);
  assert.equal(Number(ledger.rows[0]?.count), 4);
  await seedCodexsunPermissions(database);
  await seedCodexsunPermissions(database);
  return { name, database };
}
function portal(initial: Kysely<CodexsunDatabase>, tenantUuid: string) {
  let database = initial,
    actor = "owner@example.test";
  const app = Fastify();
  apps.push(app);
  app.setErrorHandler((error, _request, reply) =>
    reply
      .code(error instanceof AppError ? error.statusCode : 500)
      .send({ message: error instanceof Error ? error.message : "Unknown error" })
  );
  async function can(key: string) {
    const result =
      actor === "owner@example.test"
        ? await sql<{
            count: number;
          }>`SELECT COUNT(*) count FROM app_permissions permission INNER JOIN app_role_permissions grant_record ON grant_record.permission_id=permission.id INNER JOIN app_roles role_record ON role_record.id=grant_record.role_id WHERE permission.\`key\`=${key} AND permission.status='active' AND grant_record.status='active' AND role_record.\`key\`='admin' AND role_record.status='active'`.execute(
            database
          )
        : { rows: [{ count: 0 }] };
    return Number(result.rows[0]?.count) > 0;
  }
  registerCodexsunApi(app, async () => ({
    database,
    actorEmail: actor,
    tenantUuid,
    tenantName: "E2E tenant",
    can,
    authorize: async (key) => {
      if (!(await can(key))) throw AppError.forbidden();
    }
  }));
  return {
    app,
    replace: (value: Kysely<CodexsunDatabase>) => {
      database = value;
    },
    actor: (value: string) => {
      actor = value;
    }
  };
}
async function response(
  app: ReturnType<typeof Fastify>,
  method: "GET" | "POST" | "PATCH",
  url: string,
  payload?: object,
  status = 200
) {
  const result = await app.inject({ method, url, ...(payload ? { payload } : {}) });
  assert.equal(result.statusCode, status, result.body);
  return result.json().data;
}

try {
  const a = await fixture(true),
    b = await fixture(),
    first = portal(a.database, "aabbccdd"),
    second = portal(b.database, "11223344");
  const db = a.database,
    key = "codexsun.requirements.approve";
  await sql`UPDATE app_permissions SET status='inactive' WHERE \`key\`=${key}`.execute(db);
  await sql`UPDATE app_role_permissions grant_record INNER JOIN app_permissions permission ON permission.id=grant_record.permission_id SET grant_record.status='inactive' WHERE permission.\`key\`=${key}`.execute(
    db
  );
  await seedCodexsunPermissions(db);
  const disabled = await sql<{
    permission: string;
    grantStatus: string;
  }>`SELECT permission.status permission,grant_record.status grantStatus FROM app_permissions permission INNER JOIN app_role_permissions grant_record ON grant_record.permission_id=permission.id WHERE permission.\`key\`=${key}`.execute(
    db
  );
  assert.deepEqual(
    disabled.rows.map((row) => [row.permission, row.grantStatus]),
    [["inactive", "inactive"]]
  );
  const input = {
    clientKey: "codexsun_e2e_request",
    title: "Portal request",
    description: "😀".repeat(10000),
    priority: "high",
    origin: "desktop"
  };
  const record = await response(first.app, "POST", "/codexsun/requirements", input);
  assert.equal(
    (await response(first.app, "POST", "/codexsun/requirements", input)).uuid,
    record.uuid
  );
  await response(
    first.app,
    "POST",
    "/codexsun/requirements",
    { ...input, title: "Different" },
    409
  );
  const edited = await response(first.app, "PATCH", `/codexsun/requirements/${record.uuid}`, {
    revision: 1,
    title: "Refined portal",
    description: "Approved scope",
    priority: "normal"
  });
  assert.equal(edited.revision, 2);
  assert.equal(
    (await response(first.app, "POST", "/codexsun/requirements", input)).title,
    "Refined portal"
  );
  await response(
    first.app,
    "PATCH",
    `/codexsun/requirements/${record.uuid}`,
    { revision: 1, title: "Stale", description: "Stale", priority: "normal" },
    409
  );
  await response(first.app, "POST", `/codexsun/requirements/${record.uuid}/submit`, {
    revision: 2
  });
  await response(
    first.app,
    "POST",
    `/codexsun/requirements/${record.uuid}/decision`,
    { revision: 3, decision: "approved", note: "" },
    403
  );
  await sql`UPDATE app_permissions SET status='active' WHERE \`key\`=${key}`.execute(db);
  await sql`UPDATE app_role_permissions grant_record INNER JOIN app_permissions permission ON permission.id=grant_record.permission_id SET grant_record.status='active' WHERE permission.\`key\`=${key}`.execute(
    db
  );
  await response(
    first.app,
    "POST",
    `/codexsun/requirements/${record.uuid}/decision`,
    { revision: 2, decision: "approved", note: "" },
    409
  );
  const approved = await response(
    first.app,
    "POST",
    `/codexsun/requirements/${record.uuid}/decision`,
    { revision: 3, decision: "approved", note: "Proceed" }
  );
  assert.equal(approved.status, "approved");
  const history = await response(
    first.app,
    "GET",
    `/codexsun/requirements/${record.uuid}/activity`
  );
  assert.deepEqual(
    history.map((item: { action: string }) => item.action),
    ["created", "updated", "submitted", "approved"]
  );
  await response(second.app, "GET", `/codexsun/requirements/${record.uuid}`, undefined, 404);
  assert.equal((await response(second.app, "GET", "/codexsun/requirements")).total, 0);
  const device = await response(first.app, "POST", "/codexsun/devices", {
    deviceKey: "codexsun_e2e_desktop",
    label: "Desktop",
    kind: "desktop"
  });
  await response(first.app, "PATCH", `/codexsun/devices/${device.uuid}`, { status: "inactive" });
  await response(
    first.app,
    "POST",
    "/codexsun/devices",
    { deviceKey: "codexsun_e2e_desktop", label: "Desktop", kind: "desktop" },
    409
  );
  await response(first.app, "POST", `/codexsun/devices/${device.uuid}/heartbeat`, undefined, 409);
  await response(first.app, "PATCH", `/codexsun/devices/${device.uuid}`, { status: "active" });
  await response(first.app, "POST", `/codexsun/devices/${device.uuid}/heartbeat`);
  await response(second.app, "POST", `/codexsun/devices/${device.uuid}/heartbeat`, undefined, 404);
  await db.destroy();
  const reopened = connect(a.name);
  first.replace(reopened);
  assert.equal(
    (await response(first.app, "GET", `/codexsun/requirements/${record.uuid}`)).status,
    "approved"
  );
  assert.equal(
    (await response(first.app, "GET", `/codexsun/requirements/${record.uuid}/activity`)).length,
    4
  );
  console.log(
    "Codexsun live MariaDB E2E passed: repeatable migrations/seeds, disabled permission preservation, Unicode storage, revision and approvals, tenant isolation, device lifecycle, reconnect persistence."
  );
} finally {
  for (const app of apps) await app.close();
  for (const database of databases) await database.destroy();
  for (const name of created) {
    assert.match(name, /^codexsun_test_agent_[a-f0-9]{12}$/);
    await admin.query(`DROP DATABASE \`${name}\``);
  }
  await admin.end();
}
