import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export const storefrontAnnouncementMigration = {
  description: "Versioned storefront announcement events with display windows and timers.",
  key: "ecommerce.storefront.announcement"
} as const;

export async function migrateStorefrontAnnouncementModule(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_storefront_announcements (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE, event_key VARCHAR(64) NOT NULL UNIQUE,
 message VARCHAR(500) NOT NULL, display_duration_ms INT NOT NULL DEFAULT 12000,
 starts_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ends_at DATETIME NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'active', created_by VARCHAR(191) NOT NULL DEFAULT 'system',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX ecommerce_storefront_announcements_active (status,starts_at,ends_at,id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
