import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { DutyReportDatabase } from "./duty-report.types.js";
export const dutyReportMigrationBatch: MigrationBatch<DutyReportDatabase> = { batch: 1, description: "CRM duty reports.", scope: "crm.duty-report", version: "1.0.97", steps: [{ name: "crm.duty-report.v1", description: "Create immutable recurrence reports.", checksum: "crm.duty-report.v1:v1", version: 1, up: async (db) => { await sql.raw(`CREATE TABLE IF NOT EXISTS crm_duty_reports (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(36) NOT NULL DEFAULT (UUID()) UNIQUE,
  assignment_id INT NOT NULL, revision_id INT NOT NULL, assignee_user_id INT NOT NULL,
  performed_date DATE NOT NULL, recurrence_key VARCHAR(32) NOT NULL, actions TEXT NOT NULL,
  result VARCHAR(24) NOT NULL, issue_details TEXT NOT NULL, submitted_by VARCHAR(191) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY crm_duty_report_period_unique (assignment_id, recurrence_key),
  KEY crm_duty_reports_date_user (performed_date, assignee_user_id),
  CONSTRAINT crm_duty_report_assignment_fk FOREIGN KEY (assignment_id) REFERENCES crm_duty_assignments(id) ON DELETE RESTRICT,
  CONSTRAINT crm_duty_report_revision_fk FOREIGN KEY (revision_id) REFERENCES crm_sop_item_revisions(id) ON DELETE RESTRICT,
  CONSTRAINT crm_duty_report_user_fk FOREIGN KEY (assignee_user_id) REFERENCES app_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(db); } }] };
export const migrateDutyReportModule = (db: Kysely<DutyReportDatabase>) => runMigrationBatch(db, dutyReportMigrationBatch);
