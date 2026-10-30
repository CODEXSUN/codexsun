import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export async function migrateStorefrontOrganisation(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_storefront_organisation (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    singleton_key INT NOT NULL UNIQUE DEFAULT 1,
    company_id INT NULL,
    financial_year_id INT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    updated_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES core_companies(id),
    FOREIGN KEY (financial_year_id) REFERENCES core_financial_years(id)
  )`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_storefront_organisation_activity (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    company_id INT NOT NULL,
    financial_year_id INT NOT NULL,
    actor_email VARCHAR(191) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
    )
    .execute(database);
}

export async function upgradeStorefrontOrganisationBranding(database: Kysely<EcommerceDatabase>) {
  for (const table of [
    "ecommerce_storefront_organisation",
    "ecommerce_storefront_organisation_activity"
  ]) {
    await sql
      .raw(
        `ALTER TABLE ${table}
      ADD COLUMN IF NOT EXISTS display_name VARCHAR(191) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS logo_file_name VARCHAR(64) NULL`
      )
      .execute(database);
  }
}
