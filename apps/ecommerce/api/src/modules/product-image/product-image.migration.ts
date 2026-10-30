import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";
export const productImageMigration = {
  description: "Ordered product and variant storefront images.",
  key: "ecommerce.catalog.product-image"
} as const;
export async function migrateProductImageModule(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_product_images (
 created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration', id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 uuid CHAR(8) NOT NULL UNIQUE, product_information_id INT NOT NULL, variant_id INT NULL, url VARCHAR(1000) NOT NULL,
 alt_text VARCHAR(255) NOT NULL, caption VARCHAR(500) NOT NULL DEFAULT '', sort_order INT NOT NULL DEFAULT 1000,
 is_primary TINYINT(1) NOT NULL DEFAULT 0, status VARCHAR(24) NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX ecommerce_product_images_product (product_information_id,status,sort_order), INDEX ecommerce_product_images_variant (variant_id),
 CONSTRAINT ecommerce_product_images_product_fk FOREIGN KEY (product_information_id) REFERENCES ecommerce_product_information(id) ON DELETE RESTRICT,
 CONSTRAINT ecommerce_product_images_variant_fk FOREIGN KEY (variant_id) REFERENCES ecommerce_product_variants(id) ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
