import { sql, type Kysely } from "kysely";
import {
  runMigrationBatch,
  rollbackMigrationBatch,
  type MigrationBatch
} from "@codexsun/framework/db";
import type { AttendanceDatabase } from "./attendance.types.js";

const batch: MigrationBatch<AttendanceDatabase> = {
  scope: "hrms.attendance",
  batch: 1,
  version: "1.0.90",
  description: "Employee attendance and audit history",
  steps: [
    {
      version: 1,
      name: "hrms_attendance",
      description: "Daily attendance records and activity history",
      checksum: "hrms-attendance-employee-day-v1",
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS hrms_attendance (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          uuid CHAR(8) NOT NULL UNIQUE,
          employee_uuid CHAR(8) NOT NULL,
          work_date DATE NOT NULL,
          status VARCHAR(24) NOT NULL DEFAULT 'present',
          check_in VARCHAR(5) NULL,
          check_out VARCHAR(5) NULL,
          notes VARCHAR(2000) NOT NULL DEFAULT '',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,
          UNIQUE KEY hrms_attendance_employee_date_unique (employee_uuid,work_date),
          INDEX hrms_attendance_day_status (work_date,status,deleted_at),
          CONSTRAINT hrms_attendance_employee_fk FOREIGN KEY (employee_uuid)
            REFERENCES hrms_employees(uuid) ON DELETE RESTRICT
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS hrms_attendance_activity (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          uuid CHAR(8) NOT NULL UNIQUE,
          attendance_uuid CHAR(8) NOT NULL,
          action VARCHAR(40) NOT NULL,
          actor_email VARCHAR(191) NOT NULL,
          summary VARCHAR(500) NOT NULL,
          status VARCHAR(24) NOT NULL DEFAULT 'active',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX hrms_attendance_history (attendance_uuid,id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
      },
      down: async (database) => {
        await sql.raw("DROP TABLE IF EXISTS hrms_attendance_activity").execute(database);
        await sql.raw("DROP TABLE IF EXISTS hrms_attendance").execute(database);
      }
    }
  ]
};

export const attendanceMigrations = batch.steps.map(({ name, description }) => ({
  name,
  description
}));
export const migrateAttendanceDatabase = (database: Kysely<AttendanceDatabase>) =>
  runMigrationBatch(database, batch);
export const rollbackAttendanceDatabase = (database: Kysely<AttendanceDatabase>) =>
  rollbackMigrationBatch(database, batch);
