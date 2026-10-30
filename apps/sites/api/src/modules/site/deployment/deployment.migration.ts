import { sql, type Kysely } from "kysely";
import type { DeploymentDatabase } from "./deployment.types.js";
export async function migrateDeploymentModule(db: Kysely<DeploymentDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS sites_deployments (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, site_id INT NOT NULL,
 page_revision INT NOT NULL, sequence INT NOT NULL, checksum CHAR(64) NOT NULL, snapshot_json LONGTEXT NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'queued', actor VARCHAR(255) NOT NULL, attempts INT NOT NULL DEFAULT 0,
 error_message VARCHAR(600) NOT NULL DEFAULT '',created_at VARCHAR(30) NOT NULL,updated_at VARCHAR(30) NOT NULL,deployed_at VARCHAR(30) NULL,
 UNIQUE KEY sites_deployment_revision (site_id,page_revision), INDEX sites_deployment_status (status,updated_at),
 CONSTRAINT sites_deployment_site_fk FOREIGN KEY(site_id) REFERENCES sites_portfolio_sites(id) ON DELETE RESTRICT
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(db);
}
