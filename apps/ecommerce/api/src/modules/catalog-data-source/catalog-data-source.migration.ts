import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export const catalogDataSourceSyncMigration = {
  description: "Frappe-aligned iShop catalog fields and bidirectional sync records.",
  key: "ecommerce.catalog.data-source-sync"
} as const;

export async function migrateCatalogDataSourceSync(database: Kysely<EcommerceDatabase>) {
  const columns = [
    "ADD COLUMN IF NOT EXISTS frappe_item_code VARCHAR(191) NULL",
    "ADD COLUMN IF NOT EXISTS erpnext_item VARCHAR(191) NOT NULL DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS availability VARCHAR(64) NOT NULL DEFAULT 'Immediately'",
    "ADD COLUMN IF NOT EXISTS item_group VARCHAR(191) NOT NULL DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS web_price DECIMAL(14,2) NOT NULL DEFAULT 0",
    "ADD COLUMN IF NOT EXISTS mrp DECIMAL(14,2) NOT NULL DEFAULT 0",
    "ADD COLUMN IF NOT EXISTS frappe_image VARCHAR(1000) NOT NULL DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS highlights VARCHAR(1000) NOT NULL DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS published TINYINT(1) NOT NULL DEFAULT 0",
    "ADD UNIQUE KEY IF NOT EXISTS ecommerce_product_information_frappe_item_unique (frappe_item_code)"
  ];
  for (const column of columns) {
    await sql.raw(`ALTER TABLE ecommerce_product_information ${column}`).execute(database);
  }
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_ishop_catalogs (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
        created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
        catalog_code VARCHAR(191) NOT NULL,
        catalog_name VARCHAR(191) NOT NULL,
        description VARCHAR(500) NOT NULL DEFAULT '',
        catalog_image VARCHAR(1000) NOT NULL DEFAULT '',
        published TINYINT(1) NOT NULL DEFAULT 0,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ecommerce_ishop_catalogs_code_unique (catalog_code)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_catalog_items (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
        created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
        catalog_id INT NOT NULL,
        product_information_id INT NOT NULL,
        ishop_item VARCHAR(191) NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ecommerce_catalog_items_membership_unique (catalog_id,product_information_id),
        CONSTRAINT ecommerce_catalog_items_catalog_fk FOREIGN KEY (catalog_id) REFERENCES ecommerce_ishop_catalogs(id) ON DELETE CASCADE,
        CONSTRAINT ecommerce_catalog_items_product_fk FOREIGN KEY (product_information_id) REFERENCES ecommerce_product_information(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_catalog_sync_runs (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
        created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
        direction VARCHAR(32) NOT NULL,
        status VARCHAR(24) NOT NULL,
        item_count INT NOT NULL DEFAULT 0,
        catalog_count INT NOT NULL DEFAULT 0,
        details_json TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX ecommerce_catalog_sync_runs_created (created_at)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

export const catalogDataSourceAuditMigration = {
  description: "Add standard audit fields to catalog synchronization tables.",
  key: "ecommerce.catalog.data-source-sync-audit"
} as const;

export async function upgradeCatalogDataSourceAudit(database: Kysely<EcommerceDatabase>) {
  for (const table of ["ecommerce_ishop_catalogs", "ecommerce_catalog_items"]) {
    await sql
      .raw(
        `ALTER TABLE ${table}
          ADD COLUMN IF NOT EXISTS uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE AFTER id,
          ADD COLUMN IF NOT EXISTS created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration' AFTER uuid,
          ADD COLUMN IF NOT EXISTS status VARCHAR(24) NOT NULL DEFAULT 'active'`
      )
      .execute(database);
  }
  await sql
    .raw(
      `ALTER TABLE ecommerce_catalog_sync_runs
        MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT,
        ADD COLUMN IF NOT EXISTS uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE AFTER id,
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration' AFTER uuid,
        ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    )
    .execute(database);
}

export const catalogModuleDataSourceMigration = {
  description: "Persist the preferred read provider for each Ecommerce catalog module.",
  key: "ecommerce.catalog.module-data-source"
} as const;

export async function migrateCatalogModuleDataSources(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_catalog_module_data_sources (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
    created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
    module_key VARCHAR(64) NOT NULL,
    provider VARCHAR(24) NOT NULL DEFAULT 'own',
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    updated_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY ecommerce_catalog_module_source_key_unique (module_key),
    CONSTRAINT ecommerce_catalog_module_source_provider_check CHECK (provider IN ('own','frappe'))
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  for (const moduleKey of [
    "categories",
    "brands",
    "products",
    "product-details",
    "variants",
    "product-images",
    "sliders",
    "promotions",
    "featured-cards",
    "brand-strips",
    "season-strips",
    "campaign-events"
  ]) {
    await sql`INSERT IGNORE INTO ecommerce_catalog_module_data_sources
      (module_key,provider,updated_by) VALUES (${moduleKey},'own','system:seed')`.execute(database);
  }
}

export const catalogStorefrontSourceCompatibilityMigration = {
  description: "Add local-first source preferences for storefront sliders and promotion cards.",
  key: "ecommerce.catalog.storefront-source-compatibility"
} as const;

export async function upgradeCatalogStorefrontSourceCompatibility(
  database: Kysely<EcommerceDatabase>
) {
  for (const moduleKey of ["sliders", "promotions", "featured-cards"]) {
    await sql`INSERT IGNORE INTO ecommerce_catalog_module_data_sources
      (module_key,provider,updated_by) VALUES (${moduleKey},'own','system:compatibility')`.execute(
      database
    );
  }
}

export const catalogStorefrontUxSourceMigration = {
  description: "Add source preferences for all storefront UX content groups.",
  key: "ecommerce.catalog.storefront-ux-sources"
} as const;

export async function upgradeCatalogStorefrontUxSources(database: Kysely<EcommerceDatabase>) {
  for (const moduleKey of ["brand-strips", "season-strips", "campaign-events"]) {
    await sql`INSERT IGNORE INTO ecommerce_catalog_module_data_sources
      (module_key,provider,updated_by) VALUES (${moduleKey},'own','system:compatibility')`.execute(
      database
    );
  }
}

export const catalogStorefrontErpnextLinksMigration = {
  description: "Preserve ERPNext Item links for synchronized storefront cards.",
  key: "ecommerce.catalog.storefront-erpnext-links"
} as const;

export async function upgradeCatalogStorefrontErpnextLinks(database: Kysely<EcommerceDatabase>) {
  for (const table of [
    "ecommerce_storefront_sliders",
    "ecommerce_storefront_promotions",
    "ecommerce_storefront_featured_cards"
  ]) {
    await sql
      .raw(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS erpnext_item VARCHAR(191) NULL`)
      .execute(database);
  }
}

export const catalogDataSourceCompatibilityMigration = {
  description:
    "Retain Frappe document identity, revision, and ERPNext item fields in the local cache.",
  key: "ecommerce.catalog.frappe-cache-compatibility"
} as const;

export async function upgradeCatalogDataSourceCompatibility(database: Kysely<EcommerceDatabase>) {
  const productColumns = [
    "ADD COLUMN IF NOT EXISTS frappe_document_name VARCHAR(191) NOT NULL DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS frappe_modified_at DATETIME NULL",
    "ADD COLUMN IF NOT EXISTS erpnext_stock_uom VARCHAR(64) NOT NULL DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS erpnext_description TEXT NULL",
    "ADD COLUMN IF NOT EXISTS erpnext_disabled TINYINT(1) NOT NULL DEFAULT 0",
    "ADD COLUMN IF NOT EXISTS erpnext_is_stock_item TINYINT(1) NOT NULL DEFAULT 1",
    "ADD COLUMN IF NOT EXISTS erpnext_standard_rate DECIMAL(14,2) NOT NULL DEFAULT 0",
    "ADD COLUMN IF NOT EXISTS erpnext_modified_at DATETIME NULL"
  ];
  for (const column of productColumns) {
    await sql.raw(`ALTER TABLE ecommerce_product_information ${column}`).execute(database);
  }
  await sql
    .raw(
      `ALTER TABLE ecommerce_ishop_catalogs
        ADD COLUMN IF NOT EXISTS frappe_document_name VARCHAR(191) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS frappe_modified_at DATETIME NULL`
    )
    .execute(database);
}

export const catalogDataSourceSeedCompatibilityMigration = {
  description: "Allow non-Frappe product seeds to omit cached ERPNext description text.",
  key: "ecommerce.catalog.frappe-cache-seed-compatibility"
} as const;

export async function upgradeCatalogDataSourceSeedCompatibility(
  database: Kysely<EcommerceDatabase>
) {
  await sql
    .raw("ALTER TABLE ecommerce_product_information MODIFY COLUMN erpnext_description TEXT NULL")
    .execute(database);
}

export const catalogStorefrontSliderMigration = {
  description: "Retain the LogicX iShop storefront slider catalog selection.",
  key: "ecommerce.catalog.storefront-slider"
} as const;

export async function upgradeCatalogStorefrontSlider(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      "ALTER TABLE ecommerce_ishop_catalogs ADD COLUMN IF NOT EXISTS storefront_slider TINYINT(1) NOT NULL DEFAULT 0 AFTER published"
    )
    .execute(database);
}
