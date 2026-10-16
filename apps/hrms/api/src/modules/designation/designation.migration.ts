import { sql, type Kysely } from "kysely";
import {
  runMigrationBatch,
  rollbackMigrationBatch,
  type MigrationBatch
} from "@codexsun/framework/db";
import type { DesignationDatabase } from "./designation.types.js";

const batch: MigrationBatch<DesignationDatabase> = {
  scope: "hrms.designation",
  batch: 1,
  version: "1.0.93",
  description: "HRMS designation master and activity history",
  steps: [
    {
      version: 1,
      name: "hrms_designations",
      description: "Tenant designations and audit history",
      checksum: "hrms-designations-master-v1",
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS hrms_designations (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            uuid CHAR(8) NOT NULL UNIQUE,
            name VARCHAR(120) NOT NULL,
            description VARCHAR(500) NOT NULL DEFAULT '',
            status VARCHAR(24) NOT NULL DEFAULT 'active',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            UNIQUE KEY hrms_designation_name_unique (name),
            INDEX hrms_designation_list (deleted_at,status,name)
          ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS hrms_designation_activity (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            uuid CHAR(8) NOT NULL UNIQUE,
            designation_uuid CHAR(8) NOT NULL,
            action VARCHAR(40) NOT NULL,
            actor_email VARCHAR(191) NOT NULL,
            summary VARCHAR(500) NOT NULL,
            status VARCHAR(24) NOT NULL DEFAULT 'active',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX hrms_designation_history (designation_uuid,id)
          ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
      },
      down: async (database) => {
        await sql.raw("DROP TABLE IF EXISTS hrms_designation_activity").execute(database);
        await sql.raw("DROP TABLE IF EXISTS hrms_designations").execute(database);
      }
    }
  ]
};

export const designationMigrations = batch.steps.map(({ name, description }) => ({
  name,
  description
}));
export const migrateDesignationDatabase = (database: Kysely<DesignationDatabase>) =>
  runMigrationBatch(database, batch);
export const rollbackDesignationDatabase = (database: Kysely<DesignationDatabase>) =>
  rollbackMigrationBatch(database, batch);
