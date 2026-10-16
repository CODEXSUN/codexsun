import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";
export const productVariantMigration = {
  description: "Purchasable catalog product variants.",
  key: "ecommerce.catalog.product-variant"
} as const;
export async function migrateProductVariantModule(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_product_variants (
    created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration', id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE, product_information_id INT NOT NULL, sku VARCHAR(120) NOT NULL,
    title VARCHAR(191) NOT NULL, barcode VARCHAR(120) NOT NULL DEFAULT '', option_1_name VARCHAR(80) NOT NULL DEFAULT '',
    option_1_value VARCHAR(120) NOT NULL DEFAULT '', option_2_name VARCHAR(80) NOT NULL DEFAULT '',
    option_2_value VARCHAR(120) NOT NULL DEFAULT '', option_3_name VARCHAR(80) NOT NULL DEFAULT '',
    option_3_value VARCHAR(120) NOT NULL DEFAULT '', price_adjustment DECIMAL(14,2) NOT NULL DEFAULT 0,
    compare_at_adjustment DECIMAL(14,2) NOT NULL DEFAULT 0, cost_adjustment DECIMAL(14,2) NOT NULL DEFAULT 0,
    weight DECIMAL(12,3) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 1000,
    status VARCHAR(24) NOT NULL DEFAULT 'active', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY ecommerce_product_variants_sku_unique (sku), INDEX ecommerce_product_variants_product (product_information_id,status,sort_order),
    CONSTRAINT ecommerce_product_variants_product_fk FOREIGN KEY (product_information_id)
      REFERENCES ecommerce_product_information(id) ON DELETE RESTRICT
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
