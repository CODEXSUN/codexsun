import { sql, type Kysely } from "kysely";
import type { PublicationDatabase } from "./publication.types.js";
export async function migratePublicationModule(db: Kysely<PublicationDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS sites_publications (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    checksum CHAR(64) NOT NULL,
    payload_json LONGTEXT NOT NULL,
    actor VARCHAR(255) NOT NULL,
    created_at VARCHAR(30) NOT NULL,
    INDEX sites_publications_site_idx (site_id, id),
    CONSTRAINT sites_publications_site_fk FOREIGN KEY (site_id) REFERENCES sites_portfolio_sites(id) ON DELETE RESTRICT
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(db);
}
