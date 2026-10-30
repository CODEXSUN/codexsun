import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import { sql, type Kysely } from "kysely";
import type { SchedulerDatabase } from "./scheduler.types.js";

export const schedulerMigrationBatch: MigrationBatch<SchedulerDatabase> = {
  batch: 1,
  description: "CRM schedules and in-app reminders.",
  scope: "crm.scheduler",
  version: "1.0.97",
  steps: [
    {
      name: "crm.scheduler.v1",
      description: "Create linked CRM schedules and reminder records.",
      checksum: "crm.scheduler.v1:v1",
      version: 1,
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_schedules (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
          title VARCHAR(191) NOT NULL,
          details TEXT NOT NULL,
          source_type VARCHAR(24) NOT NULL,
          source_id INT NOT NULL,
          source_label VARCHAR(255) NOT NULL,
          scheduled_at DATETIME NOT NULL,
          reminder_at DATETIME NOT NULL,
          acknowledged_at DATETIME NULL,
          status VARCHAR(24) NOT NULL DEFAULT 'scheduled',
          assigned_user_id INT NOT NULL,
          created_by VARCHAR(191) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY crm_schedules_user_time (assigned_user_id, status, reminder_at),
          KEY crm_schedules_source (source_type, source_id),
          KEY crm_schedules_creator (created_by, status),
          CONSTRAINT crm_schedules_user_fk FOREIGN KEY (assigned_user_id) REFERENCES app_users(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
      }
    },
    {
      name: "crm.scheduler.notes-v2",
      description: "Combine existing schedule title and details into notes.",
      checksum: "crm.scheduler.notes-v2:v1",
      version: 2,
      up: async (database) => {
        const existing = await sql<{ total: number | string }>`SELECT COUNT(*) AS total
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='crm_schedules' AND COLUMN_NAME='notes'`.execute(
          database
        );
        if (Number(existing.rows[0]?.total ?? 0) === 0) {
          await sql`ALTER TABLE crm_schedules ADD COLUMN notes TEXT NULL AFTER details`.execute(
            database
          );
        }
        await sql`UPDATE crm_schedules SET notes=CONCAT(title,
          CASE WHEN details='' THEN '' ELSE CONCAT(CHAR(10), details) END)
          WHERE notes IS NULL`.execute(database);
        await sql`ALTER TABLE crm_schedules MODIFY COLUMN notes TEXT NOT NULL`.execute(database);
      }
    }
  ]
};

export const migrateSchedulerModule = (database: Kysely<SchedulerDatabase>) =>
  runMigrationBatch(database, schedulerMigrationBatch);
