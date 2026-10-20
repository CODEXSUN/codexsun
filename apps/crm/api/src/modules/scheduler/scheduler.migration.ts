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
    }
  ]
};

export const migrateSchedulerModule = (database: Kysely<SchedulerDatabase>) =>
  runMigrationBatch(database, schedulerMigrationBatch);
