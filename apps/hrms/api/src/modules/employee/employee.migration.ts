import { sql, type Kysely } from "kysely";
import {
  runMigrationBatch,
  rollbackMigrationBatch,
  type MigrationBatch
} from "@codexsun/framework/db";
import type { EmployeeDatabase } from "./employee.types.js";

const batch: MigrationBatch<EmployeeDatabase> = {
  scope: "hrms.employee",
  batch: 1,
  version: "1.0.90",
  description: "HRMS employees and activity history",
  steps: [
    {
      version: 1,
      name: "hrms_employees",
      description: "Employees with unique code and tenant user mapping",
      checksum: "hrms-employees-user-mapping-v1",
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS hrms_employees (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(8) NOT NULL UNIQUE,
        employee_code VARCHAR(40) NOT NULL,
        name VARCHAR(180) NOT NULL,
        email VARCHAR(180) NOT NULL DEFAULT '',
        phone VARCHAR(30) NOT NULL DEFAULT '',
        department VARCHAR(120) NOT NULL DEFAULT '',
        designation VARCHAR(120) NOT NULL DEFAULT '',
        joining_date DATE NULL,
        user_id INT NULL,
        notes TEXT NOT NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        UNIQUE KEY hrms_employee_code_unique (employee_code),
        UNIQUE KEY hrms_employee_user_unique (user_id),
        INDEX hrms_employee_list (deleted_at,status,name),
        CONSTRAINT hrms_employee_user_fk FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE RESTRICT
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
        // Retain history after force deletion; UUIDs deliberately have no employee FK.
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS hrms_employee_activity (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
        employee_uuid CHAR(8) NOT NULL, action VARCHAR(40) NOT NULL,
        actor_email VARCHAR(191) NOT NULL, summary VARCHAR(500) NOT NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX hrms_employee_history (employee_uuid,id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
      },
      down: async (database) => {
        await sql.raw("DROP TABLE IF EXISTS hrms_employee_activity").execute(database);
        await sql.raw("DROP TABLE IF EXISTS hrms_employees").execute(database);
      }
    }
  ]
};
export const employeeMigrations = batch.steps.map(({ name, description }) => ({
  name,
  description
}));
export const migrateEmployeeDatabase = (database: Kysely<EmployeeDatabase>) =>
  runMigrationBatch(database, batch);
export const rollbackEmployeeDatabase = (database: Kysely<EmployeeDatabase>) =>
  rollbackMigrationBatch(database, batch);
