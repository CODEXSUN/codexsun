import { sql, type Kysely } from "kysely";
import {
  ensureStandardTableColumns,
  runMigrationBatch,
  type MigrationBatch
} from "@codexsun/framework/db";
import { convertNaturalPrimaryKey } from "../connection/connection.migration.js";
import type { FrappeUserMappingDatabase } from "./user-mapping.types.js";

export const frappeUserMappingMigrationBatch: MigrationBatch<FrappeUserMappingDatabase> = {
  batch: 1,
  scope: "frappe.user-mapping",
  version: "1.0.84",
  description: "Adopt local to Frappe user mappings and standardize their audit columns.",
  steps: [
    {
      name: "frappe.user-mapping.v1",
      checksum: "frappe.user-mapping.v1",
      description: "Adopt existing local to Frappe user mappings.",
      version: 1,
      up: applyFrappeUserMappingSchema
    },
    {
      name: "frappe.user-mapping.standard-columns-v2",
      checksum: "frappe.user-mapping.standard-columns-v2",
      description: "Add standard identity and audit columns without changing local user keys.",
      version: 2,
      up: standardizeFrappeUserMappingSchema
    }
  ]
};

export const frappeUserMappingMigrations = frappeUserMappingMigrationBatch.steps.map(
  ({ name, description }) => ({ name, description })
);

export async function migrateFrappeUserMappingDatabase(
  database: Kysely<FrappeUserMappingDatabase>
) {
  return runMigrationBatch(database, frappeUserMappingMigrationBatch);
}

async function applyFrappeUserMappingSchema(database: Kysely<FrappeUserMappingDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS frappe_user_mappings (
    local_user_id INT NOT NULL PRIMARY KEY,
    frappe_user_id VARCHAR(191) NOT NULL,
    frappe_email VARCHAR(180) NOT NULL,
    employee_code VARCHAR(191) NULL,
    connection_hash CHAR(64) NOT NULL,
    verified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY frappe_user_mapping_remote (connection_hash, frappe_user_id),
    CONSTRAINT frappe_user_mapping_local_fk FOREIGN KEY (local_user_id)
      REFERENCES app_users (id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

export async function rollbackFrappeUserMappingDatabase(
  database: Kysely<FrappeUserMappingDatabase>
) {
  void database;
  throw new Error("Frappe rollback requires a reviewed, data-preserving migration plan.");
}

async function standardizeFrappeUserMappingSchema(database: Kysely<FrappeUserMappingDatabase>) {
  await convertNaturalPrimaryKey(database, "frappe_user_mappings", "local_user_id");
  await ensureStandardTableColumns(database, ["frappe_user_mappings"]);
}
