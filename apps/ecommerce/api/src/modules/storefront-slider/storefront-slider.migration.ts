import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export const storefrontSliderMigration = {
  description: "Store Ecommerce home slider documents and their Frappe source identity.",
  key: "ecommerce.storefront.slider-document"
} as const;

export async function migrateStorefrontSliderModule(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_storefront_sliders (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
        created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
        slider_code VARCHAR(191) NOT NULL,
        eyebrow VARCHAR(191) NOT NULL DEFAULT '',
        title VARCHAR(191) NOT NULL,
        description VARCHAR(500) NOT NULL DEFAULT '',
        image_url VARCHAR(1000) NOT NULL DEFAULT '',
        action_label VARCHAR(120) NOT NULL DEFAULT '',
        action_url VARCHAR(1000) NOT NULL DEFAULT '',
        ishop_item VARCHAR(191) NULL,
        display_order INT NOT NULL DEFAULT 0,
        published TINYINT(1) NOT NULL DEFAULT 0,
        starts_at DATETIME NULL,
        ends_at DATETIME NULL,
        frappe_document_name VARCHAR(191) NOT NULL DEFAULT '',
        frappe_modified_at DATETIME NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ecommerce_storefront_sliders_code_unique (slider_code),
        INDEX ecommerce_storefront_sliders_publication (published,status,display_order)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
