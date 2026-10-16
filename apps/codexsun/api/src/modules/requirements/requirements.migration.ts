import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { RequirementsDatabase } from "./requirements.types.js";
export const requirementsMigrationBatch: MigrationBatch<RequirementsDatabase> = {
  batch: 1,
  scope: "codexsun.requirements",
  version: "1.0.87",
  description: "Personal assistance requirements and decisions.",
  steps: [
    {
      name: "codexsun.requirements.initial",
      version: 1,
      checksum: "codexsun.requirements.initial:v1",
      description: "Create requirement and owned activity tables.",
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS codexsun_requirements (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
 client_key VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 request_hash CHAR(64) NOT NULL, title VARCHAR(200) NOT NULL, description MEDIUMTEXT NOT NULL, priority VARCHAR(24) NOT NULL,
 origin VARCHAR(24) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'draft', revision INT NOT NULL,
 decision_note TEXT NOT NULL, created_by VARCHAR(191) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY codexsun_requirement_request (created_by,client_key), INDEX codexsun_requirement_state(status,updated_at)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS codexsun_requirement_activity (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
 requirement_uuid CHAR(8) NOT NULL, action VARCHAR(24) NOT NULL, revision INT NOT NULL,
 note TEXT NOT NULL, actor_email VARCHAR(191) NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'active', created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(requirement_uuid) REFERENCES codexsun_requirements(uuid), INDEX codexsun_activity_requirement(requirement_uuid,id)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
      }
    },
    {
      name: "codexsun.requirements.activity-standard-v2",
      version: 2,
      checksum: "codexsun.requirements.activity-standard-v2:v1",
      description: "Add standard audit columns without changing requirement history.",
      up: async (database) => {
        for (const [column, definition] of [
          ["status", "VARCHAR(24) NOT NULL DEFAULT 'active'"],
          ["created_by", "VARCHAR(191) NOT NULL DEFAULT 'system:migration'"],
          ["updated_at", "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)"]
        ] as const) {
          const result = await sql<{
            count: number;
          }>`SELECT COUNT(*) count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='codexsun_requirement_activity' AND COLUMN_NAME=${column}`.execute(
            database
          );
          if (Number(result.rows[0]?.count) === 0)
            await sql
              .raw(`ALTER TABLE codexsun_requirement_activity ADD COLUMN ${column} ${definition}`)
              .execute(database);
        }
        await sql`UPDATE codexsun_requirement_activity SET created_by=actor_email WHERE created_by='system:migration'`.execute(
          database
        );
      }
    }
  ]
};
export const migrateRequirementsDatabase = (database: Kysely<RequirementsDatabase>) =>
  runMigrationBatch(database, requirementsMigrationBatch);
