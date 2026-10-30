import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../../apps/platform/api/src/env.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import { seedCrmTenantDatabase } from "../../apps/crm/api/src/crm.seed.js";
import { migrateFrappeTenantDatabase } from "../../apps/frappe/api/src/modules/connection/connection.migration.js";
import { migrateFrappeUserMappingDatabase } from "../../apps/frappe/api/src/modules/user-mapping/user-mapping.migration.js";
import { seedFrappeConnectionPermissions } from "../../apps/frappe/api/src/modules/connection/connection.seed.js";
import { migrateEcommerceTenantDatabase } from "../../apps/ecommerce/api/src/modules/ecommerce-composition/ecommerce-composition.migration.js";
import { seedEcommerceTenantModules } from "../../apps/ecommerce/api/src/modules/ecommerce-composition/ecommerce-composition.seed.js";
import { migrateZetroChatDatabase } from "../../apps/zetro/api/src/modules/chat/chat.migration.js";
import { migrateZetroProviderDatabase } from "../../apps/zetro/api/src/modules/provider/provider.migration.js";
import { seedZetroChatPermissions } from "../../apps/zetro/api/src/modules/chat/chat.seed.js";
import { seedZetroProviderPermission } from "../../apps/zetro/api/src/modules/provider/provider.seed.js";
import { migrateMailModule } from "../../apps/mail/api/src/modules/mail/mail.migration.js";
import { seedMailModule } from "../../apps/mail/api/src/modules/mail/mail.seed.js";
import { restoreDumpInSandbox } from "./restore-dump-sandbox.js";

const dumpPath = process.argv[2];
if (env.NODE_ENV === "production" || !dumpPath) {
  throw new Error("Pass a tenant SQL dump path in a nonproduction environment.");
}
const sourceName = basename(dumpPath, ".sql");
if (!/^[a-z][a-z0-9_]*$/.test(sourceName)) throw new Error("Invalid dump name.");
const databaseName = `codexsun_upgrade_${sourceName}_${randomBytes(4).toString("hex")}`;
const withFixtures = process.env.CODEXSUN_UPGRADE_FIXTURES === "1";
const admin = await createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  multipleStatements: true
});
let database: Kysely<Record<string, Record<string, unknown>>> | undefined;

try {
  const dump = readFileSync(resolve(dumpPath), "utf8");
  const restored = restoreDumpInSandbox(dump, sourceName, databaseName);
  const [existing] = await admin.query<Array<{ SCHEMA_NAME: string }>>(
    "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?",
    [databaseName]
  );
  assert.equal(existing.length, 0, "Sandbox database name already exists.");
  await admin.query(restored);
  database = new Kysely({
    dialect: new MysqlDialect({
      pool: createPool({
        database: databaseName,
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD
      })
    })
  });

  const oldRows = await tableCounts(databaseName);
  const oldBusinessData = await businessFingerprints();
  if (withFixtures) {
    await admin.query(`CREATE TABLE \`${databaseName}\`.frappe_data_sources (
    module_key VARCHAR(191) NOT NULL PRIMARY KEY,
    provider ENUM('local','frappe') NOT NULL DEFAULT 'local',
    updated_by VARCHAR(191) NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
    await admin.query(
      `INSERT INTO \`${databaseName}\`.frappe_data_sources (module_key,provider,updated_by)
      VALUES ('crm.enquiries','local','upgrade-fixture')`
    );
    await admin.query(`CREATE TABLE \`${databaseName}\`.ecommerce_catalog (
    id INT NOT NULL PRIMARY KEY, legacy_note VARCHAR(80) NOT NULL)`);
    await admin.query(
      `INSERT INTO \`${databaseName}\`.ecommerce_catalog VALUES (1,'keep legacy catalog')`
    );
  }
  const [mailStage] = await admin.query<Array<{ count: number }>>(
    `SELECT COUNT(*) AS count FROM \`${databaseName}\`.migration_schema
      WHERE name='mail.smtp-only-provider-v1' AND status='applied'`
  );
  const hasPendingMailRetirement = withFixtures && Number(mailStage[0]?.count ?? 0) === 0;
  if (hasPendingMailRetirement) {
    await admin.query(`ALTER TABLE \`${databaseName}\`.mail_settings
      ADD COLUMN IF NOT EXISTS hostinger_mailbox_id VARCHAR(191) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS hostinger_api_token_secret LONGTEXT NOT NULL DEFAULT ''`);
    await admin.query(`INSERT INTO \`${databaseName}\`.mail_settings
      (uuid,company_id,provider,hostinger_mailbox_id,hostinger_api_token_secret,
        smtp_password_secret,inbound_password_secret)
      VALUES ('feedcafe',0,'hostinger-api','legacy-mailbox','fixture-encrypted-token','','')`);
  }

  let firstPassRows: Map<string, number> | undefined;
  for (let pass = 0; pass < 2; pass += 1) {
    await migrateCrmTenantDatabase(database as never);
    await migrateFrappeTenantDatabase(database as never);
    await migrateFrappeUserMappingDatabase(database as never);
    await migrateEcommerceTenantDatabase(database as never);
    await migrateZetroChatDatabase(database as never);
    await migrateZetroProviderDatabase(database as never);
    await migrateMailModule(database);
    await seedCrmTenantDatabase(database as never);
    await seedFrappeConnectionPermissions(database as never);
    await seedEcommerceTenantModules(database as never, databaseName);
    await seedZetroChatPermissions(database as never);
    await seedZetroProviderPermission(database as never);
    await seedMailModule(database);
    const passRows = await tableCounts(databaseName);
    if (firstPassRows) {
      assert.deepEqual(passRows, firstPassRows, "A second migrate/seed pass changed row counts.");
    } else {
      firstPassRows = passRows;
    }
  }

  const newRows = await tableCounts(databaseName);
  for (const [table, count] of oldRows) {
    assert.ok(newRows.has(table), `Existing table ${table} disappeared.`);
    assert.ok(newRows.get(table)! >= count, `Existing table ${table} lost rows.`);
  }
  if (withFixtures) {
    assert.equal(newRows.get("ecommerce_catalog"), 1);
    const [frappeRows] = await admin.query<Array<{ module_key: string; id: number; uuid: string }>>(
      `SELECT module_key,id,uuid FROM \`${databaseName}\`.frappe_data_sources`
    );
    assert.equal(frappeRows[0]?.module_key, "crm.enquiries");
    assert.ok(frappeRows[0]?.id && frappeRows[0]?.uuid);
  }
  if (hasPendingMailRetirement) {
    const [mailRows] = await admin.query<
      Array<{
        provider: string;
        retired_provider_kind: string;
        retired_provider_api_token_secret: string;
      }>
    >(`SELECT provider,retired_provider_kind,retired_provider_api_token_secret
      FROM \`${databaseName}\`.mail_settings WHERE uuid='feedcafe'`);
    assert.deepEqual(mailRows[0], {
      provider: "smtp",
      retired_provider_kind: "hostinger-api",
      retired_provider_api_token_secret: "fixture-encrypted-token"
    });
  }
  assert.deepEqual(await businessFingerprints(), oldBusinessData);
  const [ledger] = await admin.query<Array<{ scope: string; count: number }>>(
    `SELECT scope,COUNT(*) AS count FROM \`${databaseName}\`.migration_schema
      WHERE name LIKE 'crm.%' OR scope IN ('frappe.connection','frappe.user-mapping',
        'ecommerce.modules','zetro.chat','zetro.provider','mail')
      GROUP BY scope ORDER BY scope`
  );
  for (const prefix of ["crm", "frappe", "ecommerce", "zetro", "mail"]) {
    assert.ok(
      ledger.some((row) => row.scope.startsWith(prefix)),
      `${prefix} has no ledger rows.`
    );
  }
  console.log("Restored tenant upgrade passed", { databaseName, ledger });
} finally {
  await database?.destroy();
  await admin.end();
}

async function tableCounts(databaseName: string) {
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

async function businessFingerprints() {
  const fingerprints = new Map<string, string>();
  for (const table of [
    "app_users",
    "core_companies",
    "core_contacts",
    "billing_sales",
    "billing_purchases",
    "mail_messages"
  ]) {
    const [rows] = await admin.query<Array<Record<string, unknown>>>(
      `SELECT * FROM \`${databaseName}\`.\`${table}\` ORDER BY id`
    );
    fingerprints.set(table, createHash("sha256").update(JSON.stringify(rows)).digest("hex"));
  }
  return fingerprints;
}
