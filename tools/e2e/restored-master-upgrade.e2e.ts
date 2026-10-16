import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createConnection } from "mysql2/promise";
import "dotenv/config";
import { restoreDumpInSandbox } from "./restore-dump-sandbox.js";

const dumpPath = process.argv[2];
if (process.env.NODE_ENV === "production" || !dumpPath) {
  throw new Error("Pass a master SQL dump path in a nonproduction environment.");
}
const sourceName = basename(dumpPath, ".sql");
if (!/^[a-z][a-z0-9_]*$/.test(sourceName)) throw new Error("Invalid dump name.");
const databaseName = `codexsun_upgrade_${sourceName}_${randomBytes(4).toString("hex")}`;
const withFixtures = process.env.CODEXSUN_UPGRADE_FIXTURES === "1";
const admin = await createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true
});

try {
  const dump = readFileSync(resolve(dumpPath), "utf8");
  const restored = restoreDumpInSandbox(dump, sourceName, databaseName);
  const [existing] = await admin.query<Array<{ SCHEMA_NAME: string }>>(
    "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?",
    [databaseName]
  );
  assert.equal(existing.length, 0, "Sandbox database name already exists.");
  await admin.query(restored);
  const originalRows = await tableCounts();
  const originalTenants = await tenantFingerprint();
  if (withFixtures) {
    await admin.query(`INSERT INTO \`${databaseName}\`.task_manager_todos
      (uuid,title,description) VALUES ('feedcafe','Upgrade fixture','Keep historical description')`);
  }

  process.env.DB_MASTER_NAME = databaseName;
  const platform = await import("../../apps/platform/api/src/database/platform-database.js");
  try {
    await platform.migratePlatformDatabase();
    await platform.seedPlatformDatabase();
    await platform.migratePlatformDatabase();
    await platform.seedPlatformDatabase();
    const { StorageManagerRepository } =
      await import("../../apps/platform/api/src/modules/storage-manager/storage-manager.repository.js");
    const { TenantRepository } =
      await import("../../apps/platform/api/src/modules/tenant/tenant.repository.js");
    const { provisionTenantStorage } =
      await import("../../apps/platform/api/src/modules/tenant/tenant.seed.js");
    await new StorageManagerRepository().roots();
    const firstTenant = (await new TenantRepository().list())[0];
    assert.ok(firstTenant);
    await provisionTenantStorage(firstTenant);
  } finally {
    await platform.closePlatformDatabase();
  }

  const currentRows = await tableCounts();
  assert.equal(await tenantFingerprint(), originalTenants);
  for (const [table, count] of originalRows) {
    const currentTable = table.startsWith("devkit_platform_registry_")
      ? table.replace("devkit_platform_registry_", "project_manager_platform_registry_")
      : table;
    assert.ok(currentRows.has(currentTable), `Existing table ${table} disappeared.`);
    assert.ok(currentRows.get(currentTable)! >= count, `Existing table ${table} lost rows.`);
  }
  if (withFixtures) {
    const [todos] = await admin.query<Array<{ description: string }>>(
      `SELECT description FROM \`${databaseName}\`.task_manager_todos WHERE uuid='feedcafe'`
    );
    assert.equal(todos[0]?.description, "Keep historical description");
  }
  console.log("Restored master upgrade passed", { databaseName });
} finally {
  await admin.end();
}

async function tenantFingerprint() {
  const [rows] = await admin.query<Array<Record<string, unknown>>>(
    `SELECT * FROM \`${databaseName}\`.tenants ORDER BY id`
  );
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

async function tableCounts() {
  const [tables] = await admin.query<Array<{ TABLE_NAME: string }>>(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'",
    [databaseName]
  );
  const counts = new Map<string, number>();
  for (const { TABLE_NAME } of tables) {
    const [rows] = await admin.query<Array<{ count: number }>>(
      `SELECT COUNT(*) AS count FROM \`${databaseName}\`.\`${TABLE_NAME}\``
    );
    counts.set(TABLE_NAME, Number(rows[0]?.count ?? 0));
  }
  return counts;
}
