import { sql, type Kysely } from "kysely";
import type { PageDatabase } from "./page.types.js";
export async function migratePageModule(db: Kysely<PageDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS sites_pages (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(8) NOT NULL UNIQUE,
    site_id INT NOT NULL UNIQUE, content_json LONGTEXT NOT NULL, published_json LONGTEXT NULL,
    revision INT NOT NULL DEFAULT 1, published_revision INT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites_portfolio_sites(id) ON DELETE RESTRICT
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(db);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS sites_page_activity (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, page_uuid VARCHAR(8) NOT NULL,
    actor VARCHAR(254) NOT NULL, action VARCHAR(24) NOT NULL, revision INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX sites_page_activity_idx (page_uuid, id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(db);
}
