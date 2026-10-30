import { sql, type Kysely } from "kysely";
import {
  runMigrationBatch,
  rollbackMigrationBatch,
  type MigrationBatch
} from "@codexsun/framework/db";
import type { DepartmentDatabase } from "./department.types.js";

const batch: MigrationBatch<DepartmentDatabase> = {
  scope: "hrms.department",
  batch: 1,
  version: "1.0.93",
  description: "HRMS department master and activity history",
  steps: [
    {
      version: 1,
      name: "hrms_departments",
      description: "Tenant departments and audit history",
      checksum: "hrms-departments-master-v1",
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS hrms_departments (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            uuid CHAR(8) NOT NULL UNIQUE,
            name VARCHAR(120) NOT NULL,
            description VARCHAR(500) NOT NULL DEFAULT '',
            status VARCHAR(24) NOT NULL DEFAULT 'active',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            UNIQUE KEY hrms_department_name_unique (name),
            INDEX hrms_department_list (deleted_at,status,name)
          ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS hrms_department_activity (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            uuid CHAR(8) NOT NULL UNIQUE,
            department_uuid CHAR(8) NOT NULL,
            action VARCHAR(40) NOT NULL,
            actor_email VARCHAR(191) NOT NULL,
            summary VARCHAR(500) NOT NULL,
            status VARCHAR(24) NOT NULL DEFAULT 'active',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX hrms_department_history (department_uuid,id)
          ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
      },
      down: async (database) => {
        await sql.raw("DROP TABLE IF EXISTS hrms_department_activity").execute(database);
        await sql.raw("DROP TABLE IF EXISTS hrms_departments").execute(database);
      }
    }
  ]
};

export const departmentMigrations = batch.steps.map(({ name, description }) => ({
  name,
  description
}));
export const migrateDepartmentDatabase = (database: Kysely<DepartmentDatabase>) =>
  runMigrationBatch(database, batch);
export const rollbackDepartmentDatabase = (database: Kysely<DepartmentDatabase>) =>
  rollbackMigrationBatch(database, batch);
