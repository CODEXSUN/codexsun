import { sql, type Kysely } from "kysely";
import type { MarketingDatabase } from "../../context.js";
export async function migrateSubmission(database: Kysely<MarketingDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS marketing_submissions(
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,company_id INT NOT NULL,brand_uuid CHAR(8) NOT NULL,capture_uuid CHAR(8) NOT NULL,campaign_uuid CHAR(8) NOT NULL,campaign_label VARCHAR(160) NOT NULL,
 source_key VARCHAR(191) NOT NULL,payload_hash CHAR(64) NOT NULL,name VARCHAR(160) NOT NULL,email VARCHAR(254) NOT NULL,phone VARCHAR(40) NOT NULL,message TEXT NOT NULL,
 source_reference VARCHAR(191) NOT NULL DEFAULT '',source_consented_at VARCHAR(40) NOT NULL DEFAULT '',source_notice_version VARCHAR(80) NOT NULL DEFAULT 'unknown',privacy_consent BOOLEAN NOT NULL,notice_version VARCHAR(40) NOT NULL,consent_notice TEXT NOT NULL,created_by VARCHAR(191) NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'pending',lead_uuid CHAR(8) NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,delivered_at DATETIME NULL,
 UNIQUE KEY submission_source(company_id,capture_uuid,source_key),INDEX handoff(status,id)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
