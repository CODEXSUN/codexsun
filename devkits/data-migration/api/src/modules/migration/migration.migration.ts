import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";

async function createTables(database: Kysely<unknown>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_migration_sources (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    label VARCHAR(120) NOT NULL,
    host VARCHAR(253) NOT NULL,
    port INT NOT NULL,
    database_name VARCHAR(191) NOT NULL,
    user_name VARCHAR(191) NOT NULL,
    password_ciphertext TEXT NOT NULL,
    tls_mode VARCHAR(24) NOT NULL DEFAULT 'required',
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    verified_at DATETIME NULL,
    created_by VARCHAR(191) NOT NULL,
    updated_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_migration_runs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    source_id INT NOT NULL,
    target_tenant_id INT NOT NULL,
    table_name VARCHAR(191) NOT NULL,
    source_rows BIGINT NOT NULL DEFAULT 0,
    copied_rows BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(24) NOT NULL DEFAULT 'running',
    error_text TEXT NULL,
    created_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_data_migration_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
}

async function upgradeExternalSourceSchema(database: Kysely<unknown>) {
  if (!(await hasColumn(database, "data_migration_sources", "tls_mode"))) {
    await sql`ALTER TABLE data_migration_sources
      ADD COLUMN tls_mode VARCHAR(24) NOT NULL DEFAULT 'required'`.execute(database);
  }
  if (!(await hasColumn(database, "data_migration_sources", "updated_by"))) {
    await sql`ALTER TABLE data_migration_sources
      ADD COLUMN updated_by VARCHAR(191) NOT NULL DEFAULT 'system:migration'`.execute(database);
  }
  if (!(await hasColumn(database, "data_migration_runs", "source_id"))) {
    await sql`ALTER TABLE data_migration_runs
      CHANGE COLUMN source_tenant_id source_id INT NOT NULL`.execute(database);
  }
}

async function hasColumn(database: Kysely<unknown>, table: string, column: string) {
  const result = await sql<{ total: number | string }>`SELECT COUNT(*) AS total
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND COLUMN_NAME = ${column}`.execute(
    database
  );
  return Number(result.rows[0]?.total ?? 0) > 0;
}

const migrationBatch: MigrationBatch<unknown> = {
  batch: 1,
  description: "Data Migration external sources and run ledger.",
  scope: "data-migration",
  version: "1.1.0",
  steps: [
    {
      checksum: "data-migration.external-sources-and-runs-v1",
      description: "Create encrypted external source connections and transfer history.",
      name: "data-migration.external-sources-and-runs-v1",
      up: createTables,
      version: 1
    },
    {
      checksum: "data-migration.external-sources-upgrade-v2",
      description: "Upgrade earlier source and run tables for external MariaDB transfers.",
      name: "data-migration.external-sources-upgrade-v2",
      up: upgradeExternalSourceSchema,
      version: 2
    }
  ]
};

export async function migrateDataMigrationDatabase(database: Kysely<unknown>) {
  await runMigrationBatch(database, migrationBatch);
}
