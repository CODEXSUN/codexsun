import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { DutyAssignmentDatabase } from "./duty-assignment.types.js";

export const dutyAssignmentMigrationBatch: MigrationBatch<DutyAssignmentDatabase> = {
  batch: 1,
  description: "CRM user duty assignments.",
  scope: "crm.duty-assignment",
  version: "1.0.97",
  steps: [
    {
      name: "crm.duty-assignment.v1",
      description: "Create revision-bound user assignments.",
      checksum: "crm.duty-assignment.v1:v1",
      version: 1,
      up: async (db) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_duty_assignments (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(36) NOT NULL DEFAULT (UUID()) UNIQUE,
      sop_item_id INT NOT NULL, revision_id INT NOT NULL, assignee_user_id INT NOT NULL,
      display_order INT NOT NULL DEFAULT 0, start_date DATE NOT NULL, end_date DATE NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active', assigned_by VARCHAR(191) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY crm_duty_assignee_status (assignee_user_id, status, display_order),
      KEY crm_duty_sop_item (sop_item_id, revision_id),
      CONSTRAINT crm_duty_item_fk FOREIGN KEY (sop_item_id) REFERENCES crm_sop_items(id) ON DELETE RESTRICT,
      CONSTRAINT crm_duty_revision_fk FOREIGN KEY (revision_id) REFERENCES crm_sop_item_revisions(id) ON DELETE RESTRICT,
      CONSTRAINT crm_duty_user_fk FOREIGN KEY (assignee_user_id) REFERENCES app_users(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(db);
      }
    },
    {
      name: "crm.duty-assignment.edit-history-v2",
      description: "Preserve duty edit history.",
      checksum: "crm.duty-assignment.edit-history-v2:v1",
      version: 2,
      up: async (db) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_duty_assignment_edits (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, assignment_id INT NOT NULL,
      before_data JSON NOT NULL, changed_by VARCHAR(191) NOT NULL,
      changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX crm_duty_assignment_edits_parent (assignment_id, id),
      FOREIGN KEY (assignment_id) REFERENCES crm_duty_assignments(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(db);
      }
    }
  ]
};
export const migrateDutyAssignmentModule = (db: Kysely<DutyAssignmentDatabase>) =>
  runMigrationBatch(db, dutyAssignmentMigrationBatch);
