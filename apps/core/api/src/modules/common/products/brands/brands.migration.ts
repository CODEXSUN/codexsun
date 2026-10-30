import type { Kysely } from "kysely";
import { sql } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";

export const brandsMigration = {
  description: "Brands master data.",
  key: "core.common.products.brands"
};

export const brandsStorefrontMigration = {
  description: "Storefront brand logos and visibility.",
  key: "core.common.products.brands-storefront"
};

export function migrateBrands(database: Kysely<CoreDatabase>) {
  return sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS core_brands (
    uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
    created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 1000,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY brands_name_unique (name)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);
}

export async function upgradeBrandsStorefront(database: Kysely<CoreDatabase>) {
  await sql
    .raw(
      `ALTER TABLE core_brands
        ADD COLUMN IF NOT EXISTS logo_url VARCHAR(1000) NOT NULL DEFAULT '' AFTER name,
        ADD COLUMN IF NOT EXISTS logo_alt VARCHAR(255) NOT NULL DEFAULT '' AFTER logo_url,
        ADD COLUMN IF NOT EXISTS show_on_storefront TINYINT(1) NOT NULL DEFAULT 1 AFTER logo_alt`
    )
    .execute(database);
}
