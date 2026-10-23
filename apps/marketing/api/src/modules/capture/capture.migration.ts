import { sql, type Kysely } from "kysely";
import type { MarketingDatabase } from "../../context.js";
export async function migrateCapture(database: Kysely<MarketingDatabase>) {
 await sql.raw(`CREATE TABLE IF NOT EXISTS marketing_capture_forms (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
 company_id INT NOT NULL, brand_uuid CHAR(8) NOT NULL,
 campaign_uuid CHAR(8) NOT NULL,
 name VARCHAR(160) NOT NULL,
 allowed_origin VARCHAR(300) NOT NULL,
 consent_notice VARCHAR(2000) NOT NULL,
 notice_version VARCHAR(40) NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'active', created_by VARCHAR(191) NOT NULL, updated_by VARCHAR(191) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY capture_name_scope (company_id,brand_uuid,name)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(database);
 await sql.raw(`CREATE TABLE IF NOT EXISTS marketing_capture_forms_activity (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, record_uuid CHAR(8) NOT NULL,
 company_id INT NOT NULL, action VARCHAR(40) NOT NULL, actor VARCHAR(191) NOT NULL,
 occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX record_scope(company_id,record_uuid)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(database);
}
