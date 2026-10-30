import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { SopItemDatabase } from "./sop-item.types.js";

export const sopItemMigrationBatch: MigrationBatch<SopItemDatabase> = {
  batch: 1, description: "CRM SOP Items and versioned instructions.", scope: "crm.sop-item", version: "1.0.97",
  steps: [{
    checksum: "crm.sop-item.revisions-v1:v1", description: "Create SOP Items and immutable published revisions.",
    name: "crm.sop-item.revisions-v1", version: 1,
    up: async (database) => {
      await sql.raw(`CREATE TABLE IF NOT EXISTS crm_sop_items (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(36) NOT NULL DEFAULT (UUID()) UNIQUE,
        sop_id INT NOT NULL, code VARCHAR(64) NOT NULL, title VARCHAR(191) NOT NULL,
        department VARCHAR(120) NOT NULL DEFAULT '', frequency VARCHAR(24) NOT NULL,
        sort_order INT NOT NULL DEFAULT 1000, status VARCHAR(24) NOT NULL DEFAULT 'active',
        created_by VARCHAR(191) NOT NULL, updated_by VARCHAR(191) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY crm_sop_items_code_unique (sop_id, code),
        INDEX crm_sop_items_sop_status_order (sop_id, status, sort_order),
        CONSTRAINT crm_sop_items_sop_fk FOREIGN KEY (sop_id) REFERENCES crm_sops(id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(database);
      await sql.raw(`CREATE TABLE IF NOT EXISTS crm_sop_item_revisions (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(36) NOT NULL DEFAULT (UUID()) UNIQUE,
        sop_item_id INT NOT NULL, revision INT NOT NULL, instructions MEDIUMTEXT NOT NULL,
        evidence_guidance TEXT NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'draft',
        effective_from DATE NULL, author VARCHAR(191) NOT NULL, published_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY crm_sop_item_revision_unique (sop_item_id, revision),
        INDEX crm_sop_item_revision_status (sop_item_id, status, revision),
        CONSTRAINT crm_sop_item_revisions_item_fk FOREIGN KEY (sop_item_id) REFERENCES crm_sop_items(id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(database);
    }
  }]
};
export const migrateSopItemModule = (database: Kysely<SopItemDatabase>) => runMigrationBatch(database, sopItemMigrationBatch);
