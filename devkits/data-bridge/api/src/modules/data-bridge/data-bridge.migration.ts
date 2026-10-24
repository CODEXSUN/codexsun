import { sql } from "kysely";
import type { Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";

async function createCommonTableImportTables(database: Kysely<unknown>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_bridge_common_table_imports (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    source_id INT NOT NULL,
    target_tenant_id INT NOT NULL,
    table_name VARCHAR(191) NOT NULL,
    source_database VARCHAR(191) NOT NULL,
    target_database VARCHAR(191) NOT NULL,
    column_names JSON NOT NULL,
    schema_hash CHAR(64) NOT NULL,
    row_count INT NOT NULL DEFAULT 0,
    imported_rows INT NOT NULL DEFAULT 0,
    skipped_rows INT NOT NULL DEFAULT 0,
    status VARCHAR(24) NOT NULL DEFAULT 'reviewed',
    error_message VARCHAR(1000) NULL,
    created_by VARCHAR(191) NOT NULL,
    updated_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_data_bridge_common_import_pair (source_id, target_tenant_id, table_name),
    INDEX idx_data_bridge_common_import_status (status, updated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_bridge_common_table_import_rows (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    import_id INT NOT NULL,
    row_no INT NOT NULL,
    row_json JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_data_bridge_common_import_row (import_id, row_no),
    CONSTRAINT fk_data_bridge_common_import_rows_import FOREIGN KEY (import_id)
      REFERENCES data_bridge_common_table_imports(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
}

async function upgradeCommonTableImportSnapshots(database: Kysely<unknown>) {
  const result = await sql<{
    Field: string;
  }>`SHOW COLUMNS FROM data_bridge_common_table_imports`.execute(database);
  const columns = new Set(result.rows.map((row) => row.Field));
  const additions = [
    ["column_names", "JSON NULL"],
    ["schema_hash", "CHAR(64) NOT NULL DEFAULT ''"],
    ["row_count", "INT NOT NULL DEFAULT 0"],
    ["imported_rows", "INT NOT NULL DEFAULT 0"],
    ["skipped_rows", "INT NOT NULL DEFAULT 0"],
    ["error_message", "VARCHAR(1000) NULL"]
  ] as const;
  for (const [name, definition] of additions) {
    if (!columns.has(name)) {
      await sql
        .raw(`ALTER TABLE data_bridge_common_table_imports ADD COLUMN ${name} ${definition}`)
        .execute(database);
    }
  }
  if (columns.has("source_rows")) {
    await sql`UPDATE data_bridge_common_table_imports SET row_count = source_rows WHERE schema_hash = ''`.execute(
      database
    );
  }
  if (columns.has("copied_rows")) {
    await sql`UPDATE data_bridge_common_table_imports SET imported_rows = copied_rows WHERE schema_hash = ''`.execute(
      database
    );
  }
  await sql`UPDATE data_bridge_common_table_imports SET column_names = '[]' WHERE column_names IS NULL`.execute(
    database
  );
  await sql
    .raw("ALTER TABLE data_bridge_common_table_imports MODIFY COLUMN column_names JSON NOT NULL")
    .execute(database);
  // Legacy reviews have no frozen schema and must be saved again before import.
  await sql`UPDATE data_bridge_common_table_imports SET status = 'failed',
    error_message = 'This review predates schema snapshots. Open the table and save a new review.'
    WHERE schema_hash = '' AND status = 'reviewed'`.execute(database);
  const rowColumns = await sql<{
    Field: string;
  }>`SHOW COLUMNS FROM data_bridge_common_table_import_rows`.execute(database);
  if (!rowColumns.rows.some((row) => row.Field === "created_by")) {
    await sql
      .raw(
        "ALTER TABLE data_bridge_common_table_import_rows ADD COLUMN created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration'"
      )
      .execute(database);
  }
}

const migrationBatch: MigrationBatch<unknown> = {
  batch: 1,
  description: "Data Bridge common table import reviews and snapshots.",
  scope: "data-bridge",
  version: "1.1.44",
  steps: [
    {
      checksum: "data-bridge.common-table-imports-v1",
      description: "Create Data Bridge common table import review and row snapshots.",
      name: "data-bridge.common-table-imports-v1",
      up: createCommonTableImportTables,
      version: 1
    },
    {
      checksum: "data-bridge.common-table-import-snapshots-v2",
      description: "Upgrade legacy Data Bridge reviews to frozen schema and row snapshots.",
      name: "data-bridge.common-table-import-snapshots-v2",
      up: upgradeCommonTableImportSnapshots,
      version: 2
    },
    {
      checksum: "data-bridge.row-audit-report-v3",
      description: "Persist row audit and import outcome reports.",
      name: "data-bridge.row-audit-report-v3",
      up: async (database) => {
        await sql
          .raw(
            "ALTER TABLE data_bridge_common_table_imports ADD COLUMN IF NOT EXISTS report_json JSON NULL"
          )
          .execute(database);
      },
      version: 3
    },
    {
      checksum: "data-bridge.common-bulk-runs-v4",
      name: "data-bridge.common-bulk-runs-v4",
      description: "Persist queued parent-ordered common table imports and combined reports.",
      version: 4,
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS data_bridge_common_import_runs (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          uuid CHAR(36) NOT NULL UNIQUE,
          source_id INT NOT NULL,
          target_tenant_id INT NOT NULL,
          status VARCHAR(24) NOT NULL DEFAULT 'queued',
          report_json JSON NOT NULL,
          created_by VARCHAR(191) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_bridge_bulk_pair (source_id, target_tenant_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
          )
          .execute(database);
      }
    },
    {
      checksum: "data-bridge.transfers-v5",
      name: "data-bridge.transfers-v5",
      description: "Persist verified staged table and field transfers.",
      version: 5,
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS data_bridge_transfers (id INT AUTO_INCREMENT PRIMARY KEY,uuid CHAR(36) NOT NULL UNIQUE,body JSON NOT NULL,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
          )
          .execute(database);
      }
    }
  ]
};

export function migrateDataBridgeDatabase(database: Kysely<unknown>) {
  return runMigrationBatch(database, migrationBatch);
}
