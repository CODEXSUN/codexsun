import { sql, type Kysely } from "kysely";
import type { MarketingDatabase } from "../../context.js";

export async function migrateConnectionAuthorization(database: Kysely<MarketingDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS marketing_connection_oauth (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,connection_uuid CHAR(8) NOT NULL,company_id INT NOT NULL,
    actor VARCHAR(191) NOT NULL,session_identity VARCHAR(191) NOT NULL,state_hash CHAR(64) NOT NULL UNIQUE,
    verifier_secret TEXT NOT NULL,grant_secret MEDIUMTEXT NULL,expires_at DATETIME NOT NULL,used_at DATETIME NULL,selection_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX oauth_connection(company_id,connection_uuid)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS marketing_connection_grants (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
    connection_uuid CHAR(8) NOT NULL,company_id INT NOT NULL,provider VARCHAR(40) NOT NULL,account_id VARCHAR(191) NOT NULL,
    grant_secret MEDIUMTEXT NOT NULL,expires_at DATETIME NOT NULL,capabilities VARCHAR(1000) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY connection_grant(company_id,connection_uuid)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
