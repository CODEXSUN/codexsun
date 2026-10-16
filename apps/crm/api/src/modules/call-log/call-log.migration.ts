import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";

export async function migrateCallLogs(database: Kysely<unknown>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS crm_call_logs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
    remote_name VARCHAR(191) NULL UNIQUE,
    direction VARCHAR(16) NOT NULL,
    from_number VARCHAR(80) NOT NULL,
    to_number VARCHAR(80) NOT NULL,
    call_status VARCHAR(32) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    user_email VARCHAR(191) NULL,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY crm_call_logs_created (created_at, id),
    KEY crm_call_logs_numbers (from_number, to_number)
  ) ENGINE=InnoDB`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS crm_call_log_sync_events (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
    call_log_id INT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remote_name VARCHAR(191) NULL,
    last_error TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY crm_call_log_sync_unique (call_log_id),
    KEY crm_call_log_sync_pending (status, available_at, id),
    CONSTRAINT crm_call_log_sync_call_fk FOREIGN KEY (call_log_id) REFERENCES crm_call_logs(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB`
    )
    .execute(database);
}

async function addMobileCallLogSync(database: Kysely<unknown>) {
  const columns = await sql<{ column_name: string }>`SELECT COLUMN_NAME AS column_name
    FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='crm_call_logs'`.execute(
    database
  );
  const names = new Set(columns.rows.map((row) => row.column_name));
  if (!names.has("source_reference"))
    await sql
      .raw("ALTER TABLE crm_call_logs ADD COLUMN source_reference VARCHAR(191) NULL")
      .execute(database);
  const indexes = await sql<{ index_name: string }>`SELECT INDEX_NAME AS index_name
    FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='crm_call_logs'`.execute(
    database
  );
  if (!indexes.rows.some((row) => row.index_name === "crm_call_logs_source_reference_uq"))
    await sql
      .raw(
        "ALTER TABLE crm_call_logs ADD UNIQUE KEY crm_call_logs_source_reference_uq (source_reference)"
      )
      .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS crm_call_log_comments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
    call_log_id INT NOT NULL,
    body TEXT NOT NULL,
    created_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY crm_call_log_comments_log_created (call_log_id, created_at, id),
    CONSTRAINT crm_call_log_comments_log_fk FOREIGN KEY (call_log_id) REFERENCES crm_call_logs(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB`
    )
    .execute(database);
}

export const callLogMigrationBatch: MigrationBatch<unknown> = {
  batch: 1,
  description: "Local CRM call logs and outbound sync events.",
  scope: "crm",
  version: "1.0.90",
  steps: [
    {
      name: "crm.call-log.local-v1",
      description: "Store call logs locally with an outbound sync ledger.",
      checksum: "crm.call-log.local-v1:v1",
      version: 1,
      up: migrateCallLogs
    },
    {
      name: "crm.call-log.mobile-v2",
      description: "Keep mobile call log uploads idempotent and store local comments.",
      checksum: "crm.call-log.mobile-v2:v1",
      version: 2,
      up: addMobileCallLogSync
    }
  ]
};

export const migrateCallLogModule = (database: Kysely<unknown>) =>
  runMigrationBatch(database, callLogMigrationBatch);
