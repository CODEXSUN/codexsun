import { sql, type Kysely } from "kysely";
import type { SitesDatabase } from "./site.types.js";

export const siteMigration = {
  description: "Create sites_portfolio_sites table for multi-client portfolio management.",
  name: "sites.site.portfolio"
};

export async function migrateSiteModule(database: Kysely<SitesDatabase>) {
  await sql`
    CREATE TABLE IF NOT EXISTS sites_portfolio_sites (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(8) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      slug VARCHAR(120) NOT NULL UNIQUE,
      primary_domain VARCHAR(255) NOT NULL UNIQUE,
      port INT NOT NULL DEFAULT 0,
      theme_key VARCHAR(120) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      description VARCHAR(255) NOT NULL DEFAULT '',
      published_pages INT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX sites_portfolio_status_idx (status)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `.execute(database);
}

export async function rollbackSiteModule(database: Kysely<SitesDatabase>) {
  await sql`DROP TABLE IF EXISTS sites_portfolio_sites`.execute(database);
}
