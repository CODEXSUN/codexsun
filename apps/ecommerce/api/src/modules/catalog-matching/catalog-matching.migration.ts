import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";
export const catalogMatchingMigration = {
  description: "Deterministic-first catalog matching requests and transactional outbox.",
  key: "ecommerce.catalog.matching"
} as const;
export const catalogMatchingUuidWidthMigration = {
  description: "Expand catalog matching UUID columns for collision-resistant identifiers.",
  key: "ecommerce.catalog.matching.uuid-width"
} as const;
export async function migrateCatalogMatchingModule(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_catalog_match_requests (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, created_by VARCHAR(191) NOT NULL DEFAULT 'system:catalog-matching', source_reference VARCHAR(191) NOT NULL,
    query_json JSON NOT NULL, product_information_id INT NULL, variant_id INT NULL, strategy VARCHAR(32) NOT NULL,
    confidence DECIMAL(6,5) NOT NULL DEFAULT 0, status VARCHAR(24) NOT NULL DEFAULT 'unmatched', correlation_id VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY ecommerce_catalog_match_source_uq (source_reference), KEY ecommerce_catalog_match_status_idx (status),
    CONSTRAINT ecommerce_catalog_match_product_fk FOREIGN KEY (product_information_id) REFERENCES ecommerce_product_information(id),
    CONSTRAINT ecommerce_catalog_match_variant_fk FOREIGN KEY (variant_id) REFERENCES ecommerce_product_variants(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_catalog_match_outbox (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, created_by VARCHAR(191) NOT NULL DEFAULT 'system:catalog-matching', event_name VARCHAR(191) NOT NULL,
    aggregate_id VARCHAR(191) NOT NULL, idempotency_key VARCHAR(191) NOT NULL UNIQUE, correlation_id VARCHAR(191) NOT NULL,
    payload_json JSON NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0,
    available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, published_at DATETIME NULL, last_error TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ecommerce_catalog_match_outbox_ready_idx (status,available_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    )
    .execute(database);
}

export async function upgradeCatalogMatchingUuidWidth(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `
    ALTER TABLE ecommerce_catalog_match_requests
    MODIFY uuid VARCHAR(16) NOT NULL
  `
    )
    .execute(database);
  await sql
    .raw(
      `
    ALTER TABLE ecommerce_catalog_match_outbox
    MODIFY uuid VARCHAR(16) NOT NULL
  `
    )
    .execute(database);
}
