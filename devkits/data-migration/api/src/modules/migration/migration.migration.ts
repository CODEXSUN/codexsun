import { sql, type Kysely } from "kysely";
import type { MigrationColumnMapping } from "./migration.types.js";
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

async function createPlans(database: Kysely<unknown>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_migration_plans (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    source_id INT NOT NULL,
    target_tenant_id INT NOT NULL,
    table_name VARCHAR(191) NOT NULL,
    column_mappings JSON NOT NULL,
    updated_by VARCHAR(191) NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_data_migration_plan (source_id, target_tenant_id, table_name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
}

async function createJobs(database: Kysely<unknown>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_migration_jobs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    session_name VARCHAR(120) NOT NULL,
    source_id INT NOT NULL,
    target_tenant_id INT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'draft',
    created_by VARCHAR(191) NOT NULL,
    updated_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_data_migration_jobs_lookup (source_id, target_tenant_id, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_migration_job_tables (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    table_name VARCHAR(191) NOT NULL,
    column_mappings JSON NOT NULL,
    updated_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_data_migration_job_table (job_id, table_name),
    CONSTRAINT fk_data_migration_job_tables_job FOREIGN KEY (job_id)
      REFERENCES data_migration_jobs(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
}

async function createQueryPlans(database: Kysely<unknown>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_migration_job_query_plans (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    job_id INT NOT NULL,
    plan_hash CHAR(64) NOT NULL,
    plan_json JSON NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'generated',
    created_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(191) NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_by VARCHAR(191) NULL,
    finalized_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_data_migration_job_query_plan (job_id),
    CONSTRAINT fk_data_migration_job_query_plans_job FOREIGN KEY (job_id)
      REFERENCES data_migration_jobs(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
}

async function upgradeJobsWithMappingHierarchy(database: Kysely<unknown>) {
  const addColumn = async (table: string, column: string, definition: string) => {
    if (!(await hasColumn(database, table, column))) {
      await sql
        .raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`)
        .execute(database);
    }
  };
  await addColumn("data_migration_jobs", "source_database", "VARCHAR(191) NOT NULL DEFAULT ''");
  await addColumn("data_migration_jobs", "source_tenant_id", "INT NULL");
  await addColumn("data_migration_jobs", "target_database", "VARCHAR(191) NOT NULL DEFAULT ''");
  await addColumn(
    "data_migration_job_tables",
    "source_table_name",
    "VARCHAR(191) NOT NULL DEFAULT ''"
  );
  await addColumn(
    "data_migration_job_tables",
    "target_table_name",
    "VARCHAR(191) NOT NULL DEFAULT ''"
  );
  await addColumn("data_migration_job_tables", "source_rows", "BIGINT NOT NULL DEFAULT 0");
  await addColumn("data_migration_job_tables", "target_rows", "BIGINT NOT NULL DEFAULT 0");
  await addColumn(
    "data_migration_job_tables",
    "mapping_status",
    "VARCHAR(24) NOT NULL DEFAULT 'pending'"
  );
  await addColumn(
    "data_migration_job_tables",
    "migration_status",
    "VARCHAR(24) NOT NULL DEFAULT 'pending'"
  );
  await sql`UPDATE data_migration_job_tables
    SET source_table_name = table_name, target_table_name = table_name
    WHERE source_table_name = '' OR target_table_name = ''`.execute(database);
  await sql
    .raw(`ALTER TABLE data_migration_job_tables MODIFY column_mappings JSON NULL`)
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_migration_job_fields (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    job_table_id INT NOT NULL,
    source_field VARCHAR(191) NOT NULL,
    destination_field VARCHAR(191) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'mapped',
    mapped_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_data_migration_job_field (job_table_id, source_field),
    CONSTRAINT fk_data_migration_job_fields_table FOREIGN KEY (job_table_id)
      REFERENCES data_migration_job_tables(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
  await addForeignKey(
    database,
    "data_migration_jobs",
    "fk_data_migration_jobs_source",
    "source_id",
    "data_migration_sources",
    "id"
  );
  await addForeignKey(
    database,
    "data_migration_jobs",
    "fk_data_migration_jobs_source_tenant",
    "source_tenant_id",
    "tenants",
    "id"
  );
  await addForeignKey(
    database,
    "data_migration_jobs",
    "fk_data_migration_jobs_target_tenant",
    "target_tenant_id",
    "tenants",
    "id"
  );
  await addUniqueIndex(
    database,
    "data_migration_job_tables",
    "uq_data_migration_job_target_table",
    "job_id, target_table_name"
  );
  await addUniqueIndex(
    database,
    "data_migration_job_fields",
    "uq_data_migration_job_destination_field",
    "job_table_id, destination_field"
  );
  const legacyMappings = await sql<{
    id: number;
    column_mappings: MigrationColumnMapping[] | string | null;
    updated_by: string;
  }>`SELECT id, column_mappings, updated_by FROM data_migration_job_tables
    WHERE column_mappings IS NOT NULL`.execute(database);
  for (const row of legacyMappings.rows) {
    const mappings =
      typeof row.column_mappings === "string"
        ? (JSON.parse(row.column_mappings) as MigrationColumnMapping[])
        : (row.column_mappings ?? []);
    for (const mapping of mappings) {
      await sql`INSERT IGNORE INTO data_migration_job_fields
        (job_table_id, source_field, destination_field, status, mapped_by)
        VALUES (${row.id}, ${mapping.sourceColumn}, ${mapping.targetColumn}, 'mapped', ${row.updated_by})`.execute(
        database
      );
    }
  }
}

async function addUniqueIndex(
  database: Kysely<unknown>,
  table: string,
  name: string,
  columns: string
) {
  const result = await sql<{ total: number | string }>`SELECT COUNT(*) AS total
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND INDEX_NAME = ${name}`.execute(
    database
  );
  if (Number(result.rows[0]?.total ?? 0) > 0) return;
  await sql
    .raw(`ALTER TABLE \`${table}\` ADD UNIQUE KEY \`${name}\` (${columns})`)
    .execute(database);
}

async function addForeignKey(
  database: Kysely<unknown>,
  table: string,
  name: string,
  column: string,
  referencedTable: string,
  referencedColumn: string
) {
  const result = await sql<{ total: number | string }>`SELECT COUNT(*) AS total
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND CONSTRAINT_NAME = ${name}`.execute(
    database
  );
  if (Number(result.rows[0]?.total ?? 0) > 0) return;
  await sql
    .raw(
      `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\`
    FOREIGN KEY (\`${column}\`) REFERENCES \`${referencedTable}\` (\`${referencedColumn}\`) ON DELETE RESTRICT`
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
    },
    {
      checksum: "data-migration.saved-mapping-plans-v3",
      description: "Store explicit source to destination column mappings per table.",
      name: "data-migration.saved-mapping-plans-v3",
      up: createPlans,
      version: 3
    },
    {
      checksum: "data-migration.named-jobs-and-table-details-v4",
      description: "Store named migration sessions with per-table mapping child records.",
      name: "data-migration.named-jobs-and-table-details-v4",
      up: createJobs,
      version: 4
    },
    {
      checksum: "data-migration.mapping-hierarchy-v5",
      description: "Add database snapshots and normalized table and field mapping detail records.",
      name: "data-migration.mapping-hierarchy-v5",
      up: upgradeJobsWithMappingHierarchy,
      version: 5
    },
    {
      checksum: "data-migration.job-query-plans-v6",
      description: "Persist generated and finalized migration query plans.",
      name: "data-migration.job-query-plans-v6",
      up: createQueryPlans,
      version: 6
    }
  ]
};

export async function migrateDataMigrationDatabase(database: Kysely<unknown>) {
  await runMigrationBatch(database, migrationBatch);
}
