import { sql, type Kysely } from "kysely";
import {
  runMigrationBatch,
  rollbackMigrationBatch,
  type MigrationBatch
} from "@codexsun/framework/db";
import type { KnowledgeDatabase } from "./knowledge.types.js";
async function up(database: Kysely<KnowledgeDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS docs_knowledge_pages (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,page_key VARCHAR(191) NOT NULL UNIQUE,
app_key VARCHAR(64) NOT NULL,app_label VARCHAR(160) NOT NULL,group_key VARCHAR(191) NOT NULL,group_label VARCHAR(191) NOT NULL,module_key VARCHAR(191) NOT NULL DEFAULT '',title VARCHAR(191) NOT NULL,summary VARCHAR(500) NOT NULL,source_path VARCHAR(500) NOT NULL,source_hash CHAR(64) NOT NULL,sort_order INT NOT NULL DEFAULT 0,body_override MEDIUMTEXT NULL,revision INT NOT NULL DEFAULT 1,status VARCHAR(24) NOT NULL DEFAULT 'active',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX docs_knowledge_navigation (app_key,status,sort_order)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS docs_knowledge_activity (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,page_uuid CHAR(8) NOT NULL,action VARCHAR(64) NOT NULL,actor VARCHAR(191) NOT NULL,summary VARCHAR(500) NOT NULL,status VARCHAR(24) NOT NULL DEFAULT 'active',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX docs_knowledge_history(page_uuid,id),CONSTRAINT docs_knowledge_history_page FOREIGN KEY(page_uuid) REFERENCES docs_knowledge_pages(uuid) ON DELETE RESTRICT) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
const batch: MigrationBatch<KnowledgeDatabase> = {
  description: "Developer documentation metadata, tenant overrides and audit",
  scope: "docs.knowledge",
  batch: 1,
  version: "1.0.87",
  steps: [
    {
      version: 1,
      name: "docs_knowledge_pages",
      description: "Create Docs-owned source metadata and audited tenant overrides",
      checksum: "docs-knowledge-metadata-overrides-v1",
      up,
      down: async (database) => {
        await sql.raw("DROP TABLE IF EXISTS docs_knowledge_activity").execute(database);
        await sql.raw("DROP TABLE IF EXISTS docs_knowledge_pages").execute(database);
      }
    }
  ]
};
export const knowledgeMigrations = batch.steps.map(({ name, description }) => ({
  name,
  description
}));
export const migrateKnowledgeDatabase = (database: Kysely<KnowledgeDatabase>) =>
  runMigrationBatch(database, batch);
export const rollbackKnowledgeDatabase = (database: Kysely<KnowledgeDatabase>) =>
  rollbackMigrationBatch(database, batch);
