import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { CrmFrappeSyncRow } from "./frappe-sync.types.js";
export type CrmFrappeSyncDatabase = { crm_frappe_sync_queue: CrmFrappeSyncRow };
export const frappeSyncMigrationBatch: MigrationBatch<CrmFrappeSyncDatabase> = {
  batch: 1,
  description: "CRM outbound Frappe sync queue.",
  scope: "crm.frappe-sync",
  version: "1.0.97",
  steps: [
    {
      name: "crm.frappe-sync.queue-v1",
      description: "Persist outbound SOP and duty sync work.",
      checksum: "crm.frappe-sync.queue-v1:v1",
      version: 1,
      up: async (db) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_frappe_sync_queue (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(36) NOT NULL DEFAULT (UUID()) UNIQUE,
 entity_type VARCHAR(32) NOT NULL, local_record_id INT NOT NULL, actor_email VARCHAR(191) NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0,
 available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, remote_name VARCHAR(191) NULL,
 last_error TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY crm_frappe_sync_record_unique (entity_type,local_record_id),
 KEY crm_frappe_sync_pending (status,available_at,id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(db);
      }
    },
    {
      name: "crm.frappe-sync.dispatch-revision-v2",
      description: "Keep delivery generations separate from retry attempts.",
      checksum: "crm.frappe-sync.dispatch-revision-v2",
      version: 2,
      up: async (db) => {
        await sql`ALTER TABLE crm_frappe_sync_queue ADD COLUMN IF NOT EXISTS dispatch_revision INT NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS source_updated_at DATETIME(3) NULL`.execute(
          db
        );
      }
    }
  ]
};
export const migrateFrappeSyncModule = (db: Kysely<CrmFrappeSyncDatabase>) =>
  runMigrationBatch(db, frappeSyncMigrationBatch);
