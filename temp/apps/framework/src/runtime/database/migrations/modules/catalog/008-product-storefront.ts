import { productTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

function lifecycleColumnsSql() {
  return `
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `
}

export const productStorefrontMigration: Migration = {
  id: '008-product-storefront',
  name: 'Product storefront merchandising',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.storefront} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL UNIQUE,
        department VARCHAR(32) NULL,
        home_slider_enabled TINYINT(1) NOT NULL DEFAULT 0,
        home_slider_order INT NOT NULL DEFAULT 0,
        promo_slider_enabled TINYINT(1) NOT NULL DEFAULT 0,
        promo_slider_order INT NOT NULL DEFAULT 0,
        feature_section_enabled TINYINT(1) NOT NULL DEFAULT 0,
        feature_section_order INT NOT NULL DEFAULT 0,
        is_new_arrival TINYINT(1) NOT NULL DEFAULT 0,
        is_best_seller TINYINT(1) NOT NULL DEFAULT 0,
        is_featured_label TINYINT(1) NOT NULL DEFAULT 0,
        catalog_badge VARCHAR(80) NULL,
        fabric VARCHAR(120) NULL,
        fit VARCHAR(120) NULL,
        sleeve VARCHAR(120) NULL,
        occasion VARCHAR(120) NULL,
        shipping_note VARCHAR(255) NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_storefront_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      INSERT INTO ${productTableNames.storefront} (
        id,
        product_id,
        department,
        home_slider_enabled,
        feature_section_enabled,
        is_featured_label
      )
      SELECT
        CONCAT('storefront:', id),
        id,
        'women',
        is_featured,
        is_featured,
        is_featured
      FROM ${productTableNames.products}
      WHERE id NOT IN (
        SELECT product_id FROM ${productTableNames.storefront}
      )
    `)
  },
}


