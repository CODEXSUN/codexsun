#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createConnection } from "mysql2/promise";
import "dotenv/config";

const sourceMaster = "codexsun_master_db";
const tenantCode = "CODEXSUN";
const addedApps = ["hrms", "docs", "himsx", "qcafe"];
const excludedApps = new Set(["devkit", "project-manager"]);
const dumpBinary = "C:\\Program Files\\MariaDB 12.3\\bin\\mariadb-dump.exe";
const targetMaster = process.env.DB_MASTER_NAME;

assert.equal(process.env.DB_HOST, "127.0.0.1");
assert.equal(Number(process.env.DB_PORT), 3306);
assert.equal(process.env.CODEXSUN_TENANCY_MODE, "multi");
assert.notEqual(process.env.NODE_ENV, "production");
assert.match(targetMaster ?? "", /^codexsun_local_[a-z0-9_]+$/u);
assert.notEqual(targetMaster, sourceMaster);
assert.ok(process.env.DB_USER && process.env.DB_PASSWORD);
assert.ok(existsSync(dumpBinary));

const connection = await createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
const backupDir = resolve(
  "D:/workspace/backups",
  `codexsun-codexsun-launcher-${new Date().toISOString().replace(/\D/gu, "").slice(0, 14)}`
);

try {
  const source = await tenantRow(sourceMaster);
  const current = await tenantRow(targetMaster);
  assert.equal(current.db_host, "127.0.0.1");
  assert.match(current.db_name, /^codexsun_local_[a-z0-9_]+$/u);
  assert.equal(current.status, "active");

  const [registered] = await connection.query(
    `SELECT module_key FROM \`${targetMaster}\`.platform_apps`
  );
  const registeredKeys = new Set(registered.map((row) => row.module_key));
  const restoredKeys = [
    ...new Set([
      ...stringArray(source.enabled_module_keys),
      ...stringArray(current.enabled_module_keys),
      ...addedApps
    ])
  ]
    .filter((key) => !excludedApps.has(key))
    .sort();
  assert.ok(restoredKeys.includes("platform.application"));
  for (const key of restoredKeys) assert.ok(registeredKeys.has(key), `Unknown app: ${key}`);

  const settings = record(current.payload_settings);
  const apps = record(settings.apps);
  const updatedSettings = {
    ...settings,
    apps: {
      ...apps,
      disabled: stringArray(apps.disabled).filter((key) => !restoredKeys.includes(key)),
      enabled: restoredKeys
    }
  };

  mkdirSync(backupDir);
  const backups = [backupDatabase(targetMaster), backupDatabase(current.db_name)];
  const [otherTenantsBefore] = await connection.query(
    `SELECT tenant_code,enabled_module_keys,payload_settings FROM \`${targetMaster}\`.tenants WHERE tenant_code<>? ORDER BY tenant_code`,
    [tenantCode]
  );
  const report = {
    backupDir,
    backups,
    sourceMaster,
    targetMaster,
    tenantCode,
    before: stringArray(current.enabled_module_keys),
    restored: restoredKeys
  };
  writeFileSync(join(backupDir, "restore-report.json"), JSON.stringify(report, null, 2));

  await connection.beginTransaction();
  try {
    await connection.query(
      `UPDATE \`${targetMaster}\`.tenants SET enabled_module_keys=?,payload_settings=? WHERE id=?`,
      [JSON.stringify(restoredKeys), JSON.stringify(updatedSettings), current.id]
    );
    await connection.query(
      `INSERT INTO \`${targetMaster}\`.tenant_audit_events
        (uuid,tenant_id,event_name,actor_email) VALUES (?,?,?,?)`,
      [
        randomBytes(4).toString("hex"),
        current.id,
        "tenant.access.restored.local",
        "system@codexsun.app"
      ]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }

  const platform = await import("../apps/platform/api/src/database/platform-database.js");
  const core = await import("@codexsun/core-api");
  const billing = await import("@codexsun/billing-api");
  const accounts = await import("@codexsun/accounts-api");
  try {
    const { TenantRepository } =
      await import("../apps/platform/api/src/modules/tenant/tenant.repository.js");
    const { seedTenantDatabase } =
      await import("../apps/platform/api/src/modules/tenant/tenant.seed.js");
    const tenant = await new TenantRepository().findByIdOrCode(tenantCode);
    assert.ok(tenant);
    await seedTenantDatabase(tenant);
    const after = await tenantRow(targetMaster);
    assert.deepEqual(stringArray(after.enabled_module_keys).sort(), restoredKeys);
    const [modules] = await connection.query(
      `SELECT module_key,enabled FROM \`${current.db_name}\`.app_module_settings WHERE module_key IN (?)`,
      [restoredKeys]
    );
    assert.deepEqual(
      new Set(modules.filter((row) => row.enabled).map((row) => row.module_key)),
      new Set(restoredKeys)
    );
    const [otherTenantsAfter] = await connection.query(
      `SELECT tenant_code,enabled_module_keys,payload_settings FROM \`${targetMaster}\`.tenants WHERE tenant_code<>? ORDER BY tenant_code`,
      [tenantCode]
    );
    assert.deepEqual(otherTenantsAfter, otherTenantsBefore);
    console.log(`Restored ${restoredKeys.length} CODEXSUN launcher apps. Backup: ${backupDir}`);
  } finally {
    await Promise.allSettled([
      platform.closePlatformDatabase(),
      core.closeCoreDatabase(),
      billing.closeAllBillingDatabases(),
      accounts.closeAllAccountsDatabases()
    ]);
  }
} finally {
  await connection.end();
}

async function tenantRow(database) {
  const [rows] = await connection.query(
    `SELECT id,tenant_code,db_host,db_name,status,enabled_module_keys,payload_settings FROM \`${database}\`.tenants WHERE tenant_code=?`,
    [tenantCode]
  );
  assert.equal(rows.length, 1, `Expected exactly one ${tenantCode} tenant in ${database}.`);
  return rows[0];
}

function backupDatabase(database) {
  assert.match(database, /^[a-z][a-z0-9_]*$/iu);
  const file = join(backupDir, `${database}.sql`);
  const result = spawnSync(
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
    { env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD }, encoding: "utf8" }
  );
  assert.equal(result.status, 0, `Backup failed for ${database}.`);
  assert.ok(existsSync(file) && statSync(file).size > 0);
  return {
    database,
    file,
    sha256: createHash("sha256").update(readFileSync(file)).digest("hex")
  };
}

function record(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      /* Retain safe empty settings. */
    }
  }
  return {};
}

function stringArray(value) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
}
