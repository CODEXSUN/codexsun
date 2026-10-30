import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { SopDatabase } from "./sop.types.js";

export const sopMigrationBatch: MigrationBatch<SopDatabase> = {
  batch: 1,
  description: "CRM SOP catalog.",
  scope: "crm.sop",
  version: "1.0.97",
  steps: [{
    checksum: "crm.sop.catalog-v1:v1",
    description: "Create local CRM SOP catalog.",
    name: "crm.sop.catalog-v1",
    version: 1,
    up: async (database) => {
      await sql.raw(`CREATE TABLE IF NOT EXISTS crm_sops (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL DEFAULT (UUID()) UNIQUE,
        code VARCHAR(64) NOT NULL,
        title VARCHAR(191) NOT NULL,
        purpose TEXT NOT NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        owner_user_id INT NULL,
        created_by VARCHAR(191) NOT NULL,
        updated_by VARCHAR(191) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY crm_sops_code_unique (code),
        INDEX crm_sops_status_title (status, title)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(database);
    }
  }]
};

export const migrateSopModule = (database: Kysely<SopDatabase>) =>
  runMigrationBatch(database, sopMigrationBatch);
