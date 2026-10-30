import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export const storefrontSchemaStandardizationMigration = {
  description: "Add required storefront ownership, identity, and lifecycle audit columns.",
  key: "ecommerce.storefront.schema-standardization-v1"
} as const;

export async function standardizeStorefrontSchema(database: Kysely<EcommerceDatabase>) {
  for (const table of [
    "ecommerce_storefront_sliders",
    "ecommerce_storefront_promotions",
    "ecommerce_storefront_featured_cards"
  ]) {
    await sql
      .raw(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration' AFTER uuid`
      )
      .execute(database);
  }
  await sql
    .raw(
      `ALTER TABLE ecommerce_storefront_announcements
    ADD COLUMN IF NOT EXISTS uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE AFTER id`
    )
    .execute(database);
  await sql
    .raw(
      `ALTER TABLE ecommerce_catalog_module_data_sources
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration' AFTER uuid,
    ADD COLUMN IF NOT EXISTS status VARCHAR(24) NOT NULL DEFAULT 'active' AFTER provider`
    )
    .execute(database);
  for (const table of ["ecommerce_catalog_match_requests", "ecommerce_catalog_match_outbox"]) {
    await sql
      .raw(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS created_by VARCHAR(191) NOT NULL DEFAULT 'system:catalog-matching' AFTER uuid`
      )
      .execute(database);
  }
}
