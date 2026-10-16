import { sql, type Kysely } from "kysely";
import {
  runMigrationBatch,
  rollbackMigrationBatch,
  type MigrationBatch
} from "@codexsun/framework/db";
import type { LogicxErpSchemeDatabase } from "./scheme.types.js";

// Schemes reference Billing sales, Core brands, and tenant users, so this batch runs
// only for tenants that also have Billing enabled.
async function migrateSchemes(database: Kysely<LogicxErpSchemeDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS logicx_erp_schemes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
    scheme_no VARCHAR(32) NOT NULL,
    scheme_date DATE NOT NULL,
    sales_id INT NOT NULL,
    priority VARCHAR(16) NOT NULL,
    support_value INT NOT NULL,
    brand_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    requested_by_user_id INT NOT NULL,
    approved_by_user_id INT NULL,
    claim_done BOOLEAN NOT NULL DEFAULT FALSE,
    amount_realized INT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    UNIQUE KEY logicx_erp_schemes_no_unique (scheme_no),
    INDEX logicx_erp_schemes_date (scheme_date),
    INDEX logicx_erp_schemes_status_priority (status, priority),
    INDEX logicx_erp_schemes_sales (sales_id),
    INDEX logicx_erp_schemes_brand (brand_id),
    CONSTRAINT logicx_erp_schemes_sales_fk FOREIGN KEY (sales_id) REFERENCES billing_sales (id) ON DELETE RESTRICT,
    CONSTRAINT logicx_erp_schemes_brand_fk FOREIGN KEY (brand_id) REFERENCES core_brands (id) ON DELETE RESTRICT,
    CONSTRAINT logicx_erp_schemes_requested_by_fk FOREIGN KEY (requested_by_user_id) REFERENCES app_users (id) ON DELETE RESTRICT,
    CONSTRAINT logicx_erp_schemes_approved_by_fk FOREIGN KEY (approved_by_user_id) REFERENCES app_users (id) ON DELETE RESTRICT
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

async function migrateSchemeActivity(database: Kysely<LogicxErpSchemeDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS logicx_erp_scheme_activity (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
    scheme_id INT NOT NULL,
    action VARCHAR(24) NOT NULL,
    summary VARCHAR(255) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_by VARCHAR(191) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX logicx_erp_scheme_activity_scheme (scheme_id, created_at),
    CONSTRAINT logicx_erp_scheme_activity_scheme_fk FOREIGN KEY (scheme_id) REFERENCES logicx_erp_schemes (id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

const batch: MigrationBatch<LogicxErpSchemeDatabase> = {
  batch: 1,
  description: "LogicX ERP vendor schemes.",
  scope: "logicx-erp.scheme",
  version: "1.0.80",
  steps: [
    {
      checksum: "logicx-erp.scheme.database-v1:v1",
      description: "Create LogicX ERP schemes.",
      name: "logicx-erp.scheme.database-v1",
      up: migrateSchemes,
      version: 1
    },
    {
      checksum: "logicx-erp.scheme.activity-v2:v1",
      description: "Create LogicX ERP scheme activity.",
      name: "logicx-erp.scheme.activity-v2",
      up: migrateSchemeActivity,
      version: 2
    }
  ]
};

export const logicxErpSchemeMigrations = batch.steps.map(({ description, name }) => ({
  description,
  name
}));
export const migrateLogicxErpSchemeDatabase = (database: Kysely<LogicxErpSchemeDatabase>) =>
  runMigrationBatch(database, batch);
export const rollbackLogicxErpSchemeDatabase = (database: Kysely<LogicxErpSchemeDatabase>) =>
  rollbackMigrationBatch(database, batch);
