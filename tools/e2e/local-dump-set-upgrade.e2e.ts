import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { createConnection } from "mysql2/promise";
import "dotenv/config";
import { restoreDumpInSandbox } from "./restore-dump-sandbox.js";

type DumpEntry = { bytes: number; database: string; file: string; sha256: string };
type DumpManifest = { dumps: DumpEntry[]; master_dump: DumpEntry };
type TenantRow = { db_name: string; id: number; slug: string; tenant_code: string; uuid: string };

const sourceDir = resolve(process.argv[2] ?? "");
const prefix = process.argv[3] ?? "codexsun_local_20261011";
const resumeDir = process.argv[4] === "--resume" ? process.argv[5] : undefined;
const localHost = "127.0.0.1";
const localPort = 3306;
const dumpBinary = "C:\\Program Files\\MariaDB 12.3\\bin\\mariadb-dump.exe";
if (!existsSync(join(sourceDir, "manifest.json"))) throw new Error("A dump manifest is required.");
if (!/^[a-z][a-z0-9_]{1,31}$/u.test(prefix)) throw new Error("Invalid local database prefix.");
if (
  process.env.NODE_ENV === "production" ||
  process.env.DB_HOST !== localHost ||
  Number(process.env.DB_PORT) !== localPort ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD
) {
  throw new Error("This upgrade requires the configured local 127.0.0.1:3306 MariaDB.");
}
if (!existsSync(dumpBinary)) throw new Error("The local MariaDB dump client is unavailable.");

const manifest = JSON.parse(readFileSync(join(sourceDir, "manifest.json"), "utf8")) as DumpManifest;
const sourceEntries = [manifest.master_dump, ...manifest.dumps];
for (const entry of sourceEntries) {
  const data = readFileSync(join(sourceDir, entry.file));
  assert.equal(data.length, entry.bytes, `${entry.file} size changed.`);
  assert.equal(sha256(data), entry.sha256, `${entry.file} checksum changed.`);
}
const targetName = (sourceName: string) => {
  const suffix =
    sourceName === manifest.master_dump.database ? "master" : sourceName.replace(/_db$/u, "");
  const name = `${prefix}_${suffix}`;
  if (!/^[a-z][a-z0-9_]{1,63}$/u.test(name) || name.length > 64) {
    throw new Error(`Invalid target database name for ${sourceName}.`);
  }
  return name;
};
const masterName = targetName(manifest.master_dump.database);
const mappings = new Map(manifest.dumps.map(({ database }) => [database, targetName(database)]));
const admin = await createConnection({
  host: localHost,
  port: localPort,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true
});
const backupDir = resumeDir
  ? resolve(resumeDir)
  : resolve(
      "D:/workspace/backups",
      `codexsun-local-upgrade-${new Date().toISOString().replace(/\D/gu, "").slice(0, 14)}`
    );
if (resumeDir && !backupDir.startsWith(resolve("D:/workspace/backups") + "\\")) {
  throw new Error("Resume backup directory must be under the local backup root.");
}
const report = {
  backupDir,
  createdUtc: new Date().toISOString(),
  localHost,
  masterName,
  sourceDir,
  sourceManifestSha256: sha256(readFileSync(join(sourceDir, "manifest.json"))),
  preSwitchBackups: [] as Array<{ database: string; file: string; sha256: string }>,
  upgradedBackups: [] as Array<{ database: string; file: string; sha256: string }>,
  tenants: [] as Array<{ code: string; database: string; migrations: number; tables: number }>
};
let platform:
  typeof import("../../apps/platform/api/src/database/platform-database.js") | undefined;
let core: typeof import("@codexsun/core-api") | undefined;
let billing: typeof import("@codexsun/billing-api") | undefined;
let accounts: typeof import("@codexsun/accounts-api") | undefined;

try {
  const targets = [masterName, ...mappings.values()];
  const [existing] = await admin.query<Array<{ SCHEMA_NAME: string }>>(
    "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME IN (?)",
    [targets]
  );
  if (resumeDir) {
    assert.equal(existing.length, targets.length, "The restored local database set is incomplete.");
    for (const name of ["codexsun_master_db", "codexsun_db"]) {
      const file = join(backupDir, `before_${name}.sql`);
      assert.ok(existsSync(file) && statSync(file).size > 0, `Missing original backup ${name}.`);
      report.preSwitchBackups.push({
        database: name,
        file: basename(file),
        sha256: sha256(readFileSync(file))
      });
    }
  } else {
    assert.equal(
      existing.length,
      0,
      "A local target database already exists; choose a new prefix."
    );
    mkdirSync(backupDir, { recursive: false });
    const currentMaster = process.env.DB_MASTER_NAME;
    assert.ok(currentMaster && /^[a-z][a-z0-9_]*$/iu.test(currentMaster));
    const currentDatabases = await currentLocalDatabases(currentMaster);
    for (const name of currentDatabases) {
      const file = join(backupDir, `before_${name}.sql`);
      report.preSwitchBackups.push(dumpLocalDatabase(name, file));
    }
    console.log(`Backed up ${report.preSwitchBackups.length} current local database(s).`);
    for (const entry of sourceEntries) {
      const target = targetName(entry.database);
      await admin.query(
        restoreDumpInSandbox(
          readFileSync(join(sourceDir, entry.file), "utf8"),
          entry.database,
          target
        )
      );
      console.log(`Restored local database ${target}.`);
    }
  }

  process.env.DB_MASTER_NAME = masterName;
  process.env.CODEXSUN_TENANCY_MODE = "multi";
  process.env.ENABLE_DEFAULT_TENANT_SEED = "0";
  process.env.DEFAULT_TENANT_DB_NAME = mappings.get("codexsun_db") ?? "";
  const storage =
    await import("../../apps/platform/api/src/modules/storage-manager/storage-manager.paths.js");
  const [originalTenants] = await admin.query<TenantRow[]>(
    `SELECT id,uuid,tenant_code,slug,db_name FROM \`${masterName}\`.tenants ORDER BY id`
  );
  assert.equal(
    originalTenants.length,
    manifest.dumps.length,
    "Master and dump tenant counts differ."
  );
  assert.deepEqual(
    new Set(originalTenants.map(({ db_name }) => db_name)),
    new Set(resumeDir ? mappings.values() : mappings.keys()),
    "Master and tenant dump names differ."
  );
  for (const tenant of originalTenants) {
    if (resumeDir) continue;
    const dbName = mappings.get(tenant.db_name);
    assert.ok(dbName);
    const roots = await storage.ensureTenantStorage(tenant.slug || tenant.tenant_code);
    await admin.query(
      `UPDATE \`${masterName}\`.tenants SET db_name=?,db_host=?,db_port=?,db_user=?,
        db_secret_ref='DB_PASSWORD',storage_root=?,storage_public_root=?,storage_private_root=?
        WHERE id=?`,
      [
        dbName,
        localHost,
        localPort,
        process.env.DB_USER,
        roots.root,
        roots.publicRoot,
        roots.privateRoot,
        tenant.id
      ]
    );
  }

  platform = await import("../../apps/platform/api/src/database/platform-database.js");
  core = await import("@codexsun/core-api");
  billing = await import("@codexsun/billing-api");
  accounts = await import("@codexsun/accounts-api");
  const { TenantRepository } =
    await import("../../apps/platform/api/src/modules/tenant/tenant.repository.js");
  const { migrateTenantDatabase, seedTenantDatabase } =
    await import("../../apps/platform/api/src/modules/tenant/tenant.seed.js");
  await platform.migratePlatformDatabase();
  await platform.seedPlatformDatabase();
  await platform.migratePlatformDatabase();
  await platform.seedPlatformDatabase();
  await admin.query(
    `UPDATE \`${masterName}\`.queue_runtime_settings
      SET backend='database',updated_by='local-dump-upgrade'
      WHERE singleton_key=1`
  );
  const tenants = await new TenantRepository().list();
  assert.equal(tenants.length, manifest.dumps.length);
  for (const tenant of tenants) {
    assert.equal(tenant.dbHost, localHost);
    assert.equal(tenant.dbPort, localPort);
    assert.ok(targets.includes(tenant.dbName));
    const oldCounts = await tableCounts(tenant.dbName);
    const migrated = await migrateTenantDatabase(tenant);
    await seedTenantDatabase(tenant);
    const firstCounts = await tableCounts(tenant.dbName);
    await seedTenantDatabase(tenant);
    assert.deepEqual(
      await tableCounts(tenant.dbName),
      firstCounts,
      `${tenant.tenantCode} changed row counts on repeat seed.`
    );
    assertOldRowsPreserved(oldCounts, firstCounts);
    report.tenants.push({
      code: tenant.tenantCode,
      database: tenant.dbName,
      migrations: migrated.migrationOrder.length,
      tables: firstCounts.size
    });
    console.log(
      `Upgraded local tenant ${tenant.tenantCode} (${report.tenants.length}/${tenants.length}).`
    );
  }
  assert.deepEqual(
    tenants
      .map(({ id, tenantCode, uuid }) => ({ id, tenantCode, uuid }))
      .sort((left, right) => left.id - right.id),
    originalTenants
      .map(({ id, tenant_code, uuid }) => ({ id, tenantCode: tenant_code, uuid }))
      .sort((left, right) => left.id - right.id)
  );
  for (const name of targets) {
    const file = join(backupDir, `upgraded_${name}.sql`);
    report.upgradedBackups.push(dumpLocalDatabase(name, file));
  }
  writeFileSync(join(backupDir, "upgrade-report.json"), JSON.stringify(report, null, 2));
  console.log(`Local upgrade passed: ${tenants.length} tenants; backups in ${backupDir}`);
} finally {
  await Promise.allSettled([
    platform?.closePlatformDatabase(),
    core?.closeCoreDatabase(),
    billing?.closeAllBillingDatabases(),
    accounts?.closeAllAccountsDatabases()
  ]);
  await admin.end();
}

async function currentLocalDatabases(masterName: string) {
  const [rows] = await admin.query<Array<{ db_name: string; db_host: string }>>(
    `SELECT db_name,db_host FROM \`${masterName}\`.tenants`
  );
  const names = new Set([masterName]);
  for (const row of rows) {
    assert.ok(
      [localHost, "localhost"].includes(row.db_host),
      "Current master points to a nonlocal tenant; backup stopped."
    );
    const [schemas] = await admin.query<Array<{ SCHEMA_NAME: string }>>(
      "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE LOWER(SCHEMA_NAME)=LOWER(?)",
      [row.db_name]
    );
    assert.equal(schemas.length, 1, `Current local database ${row.db_name} is missing.`);
    names.add(schemas[0]!.SCHEMA_NAME);
  }
  return [...names];
}

function dumpLocalDatabase(database: string, file: string) {
  assert.match(database, /^[a-z][a-z0-9_]*$/iu);
  const run = spawnSync(
    dumpBinary,
    [
      "--no-defaults",
      "--host=127.0.0.1",
      "--port=3306",
      `--user=${process.env.DB_USER}`,
      "--single-transaction",
      "--quick",
      "--routines",
      "--triggers",
      "--events",
      "--hex-blob",
      "--databases",
      database,
      `--result-file=${file}`
    ],
    {
      env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD },
      encoding: "utf8"
    }
  );
  if (run.status !== 0 || !existsSync(file) || statSync(file).size === 0) {
    throw new Error(`Local backup failed for ${database} (exit ${run.status}).`);
  }
  return { database, file: basename(file), sha256: sha256(readFileSync(file)) };
}

async function tableCounts(database: string) {
  const [tables] = await admin.query<Array<{ TABLE_NAME: string }>>(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'",
    [database]
  );
  const counts = new Map<string, number>();
  for (const { TABLE_NAME: table } of tables) {
    assert.match(table, /^[a-z][a-z0-9_]*$/iu);
    const [rows] = await admin.query<Array<{ count: number }>>(
      `SELECT COUNT(*) AS count FROM \`${database}\`.\`${table}\``
    );
    counts.set(table, Number(rows[0]?.count ?? 0));
  }
  return counts;
}

function assertOldRowsPreserved(before: Map<string, number>, after: Map<string, number>) {
  for (const [table, count] of before) {
    const current = table.replace(
      /^devkit_platform_registry_(platforms|groups|modules|activity)$/u,
      "project_manager_platform_registry_$1"
    );
    if (!after.has(current)) {
      assert.equal(count, 0, `${table} had rows before removal.`);
      continue;
    }
    assert.ok(after.get(current)! >= count, `${table} lost rows.`);
  }
}

function sha256(data: Buffer) {
  return createHash("sha256").update(data).digest("hex");
}
