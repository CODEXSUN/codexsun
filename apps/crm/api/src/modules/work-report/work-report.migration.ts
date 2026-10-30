import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { WorkReportDatabase } from "./work-report.types.js";
export const workReportMigrationBatch: MigrationBatch<WorkReportDatabase> = {
  batch: 1,
  scope: "crm.work-report",
  version: "1.1.5",
  description: "Audited work actions for enquiry and task assignments.",
  steps: [
    {
      name: "crm.work-report.actions-v1",
      checksum: "crm.work-report.actions-v1:v1",
      version: 1,
      description: "Persist idempotent work reports and GPS check-in/check-out events.",
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_work_reports (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
 enquiry_id INT NULL, task_id INT NULL, action VARCHAR(24) NOT NULL, body TEXT NOT NULL,
 request_id VARCHAR(80) NOT NULL, latitude DECIMAL(10,7) NULL, longitude DECIMAL(10,7) NULL,
 accuracy_meters DECIMAL(10,2) NULL, captured_at DATETIME NULL,
 created_by VARCHAR(191) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY crm_work_report_retry (created_by, request_id),
 INDEX crm_work_report_enquiry (enquiry_id, id), INDEX crm_work_report_task (task_id, id),
 CONSTRAINT crm_work_report_enquiry_fk FOREIGN KEY (enquiry_id) REFERENCES crm_enquiries(id) ON DELETE RESTRICT,
 CONSTRAINT crm_work_report_task_fk FOREIGN KEY (task_id) REFERENCES crm_tasks(id) ON DELETE RESTRICT,
 CONSTRAINT crm_work_report_target CHECK ((enquiry_id IS NULL) <> (task_id IS NULL))
 ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
      }
    },
    {
      name: "crm.work-report.charges-v1",
      checksum: "crm.work-report.charges-v1:v1",
      version: 2,
      description: "Store structured charge and collection amounts for enquiry and task work.",
      up: async (database) => {
        const existing = await sql<{ total: number | string }>`SELECT COUNT(*) AS total
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='crm_work_reports' AND COLUMN_NAME='amount'`.execute(
          database
        );
        if (Number(existing.rows[0]?.total ?? 0) === 0) {
          await sql`ALTER TABLE crm_work_reports ADD COLUMN amount DECIMAL(14,2) NULL AFTER body`.execute(
            database
          );
        }
      }
    }
  ]
};
export const migrateWorkReportModule = (database: Kysely<WorkReportDatabase>) =>
  runMigrationBatch(database, workReportMigrationBatch);
