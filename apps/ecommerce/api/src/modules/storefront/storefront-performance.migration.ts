import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export const storefrontPerformanceMigration = {
  description: "Indexes for published storefront catalog and primary media reads.",
  key: "ecommerce.storefront.read-performance-v1"
} as const;

export async function upgradeStorefrontReadPerformance(database: Kysely<EcommerceDatabase>) {
  const statements = [
    `ALTER TABLE ecommerce_product_information ADD INDEX IF NOT EXISTS
      ecommerce_product_information_storefront
      (publication_status,status,frappe_modified_at,is_featured,storefront_title)`,
    `ALTER TABLE ecommerce_product_images ADD INDEX IF NOT EXISTS
      ecommerce_product_images_primary
      (product_information_id,is_primary,status)`,
    `ALTER TABLE ecommerce_product_variants ADD INDEX IF NOT EXISTS
      ecommerce_product_variants_storefront
      (product_information_id,status,compare_at_adjustment)`
  ];
  for (const statement of statements) await sql.raw(statement).execute(database);
}
