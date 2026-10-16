import { sql, type Kysely } from "kysely";
import type { BlogDatabase } from "./blog.types.js";
export async function migrateBlogModule(db: Kysely<BlogDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS sites_blog_posts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(8) NOT NULL UNIQUE,
    site_id INT NOT NULL, slug VARCHAR(120) NOT NULL, content_json LONGTEXT NOT NULL,
    published_json LONGTEXT NULL, revision INT NOT NULL DEFAULT 1, published_revision INT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY sites_blog_slug_idx (site_id, slug),
    FOREIGN KEY (site_id) REFERENCES sites_portfolio_sites(id) ON DELETE RESTRICT
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(db);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS sites_blog_activity (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, post_uuid VARCHAR(8) NOT NULL, site_id INT NOT NULL,
    actor VARCHAR(254) NOT NULL, action VARCHAR(24) NOT NULL, revision INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX sites_blog_activity_idx (site_id, id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(db);
}
