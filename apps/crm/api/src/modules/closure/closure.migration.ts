import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { ClosureDatabase } from "./closure.types.js";

export const closureMigrationBatch: MigrationBatch<ClosureDatabase> = {
  batch: 1,
  description: "CRM enquiry closure approvals.",
  scope: "crm.closure",
  version: "1.0.96",
  steps: [
    {
      checksum: "crm.closure.requests-v1:v1",
      description: "Create auditable enquiry closure requests.",
      name: "crm.closure.requests-v1",
      version: 1,
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_closure_requests (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
        enquiry_id INT NOT NULL,
        requested_by_user_id INT NULL,
        requested_by VARCHAR(191) NOT NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'pending',
        request_note TEXT NULL,
        reviewed_by VARCHAR(191) NULL,
        review_note TEXT NULL,
        requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX crm_closure_status_requested (status, requested_at),
        INDEX crm_closure_enquiry_status (enquiry_id, status),
        CONSTRAINT crm_closure_enquiry_fk FOREIGN KEY (enquiry_id) REFERENCES crm_enquiries (id) ON DELETE RESTRICT,
        CONSTRAINT crm_closure_requester_fk FOREIGN KEY (requested_by_user_id) REFERENCES app_users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
      }
    }
  ]
};

export const migrateClosureModule = (database: Kysely<ClosureDatabase>) =>
  runMigrationBatch(database, closureMigrationBatch);
