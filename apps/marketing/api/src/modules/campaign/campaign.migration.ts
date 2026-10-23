import { sql, type Kysely } from "kysely";
import type { MarketingDatabase } from "../../context.js";
export async function migrateCampaign(database: Kysely<MarketingDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS marketing_campaigns (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
 company_id INT NOT NULL, brand_uuid CHAR(8) NOT NULL,
 name VARCHAR(160) NOT NULL,
 objective VARCHAR(500) NOT NULL,
 channel VARCHAR(40) NOT NULL,
 landing_url VARCHAR(1000) NOT NULL DEFAULT '',
 status VARCHAR(24) NOT NULL DEFAULT 'active', created_by VARCHAR(191) NOT NULL, updated_by VARCHAR(191) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY campaign_name_scope (company_id,brand_uuid,name)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS marketing_campaigns_activity (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, record_uuid CHAR(8) NOT NULL,
 company_id INT NOT NULL, action VARCHAR(40) NOT NULL, actor VARCHAR(191) NOT NULL,
 occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX record_scope(company_id,record_uuid)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

export async function upgradeCampaignIntegrity(database: Kysely<MarketingDatabase>) {
  await sql
    .raw("ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS revision INT NOT NULL DEFAULT 1")
    .execute(database);
  await sql
    .raw(
      "ALTER TABLE marketing_campaigns ADD UNIQUE INDEX IF NOT EXISTS campaign_brand_uuid(company_id,brand_uuid,uuid)"
    )
    .execute(database);
  if (
    !(
      await sql`SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='marketing_campaigns' AND CONSTRAINT_NAME='campaign_brand_fk'`.execute(
        database
      )
    ).rows.length
  )
    await sql
      .raw(
        "ALTER TABLE marketing_campaigns ADD CONSTRAINT campaign_brand_fk FOREIGN KEY(company_id,brand_uuid) REFERENCES marketing_brands(company_id,uuid) ON DELETE RESTRICT"
      )
      .execute(database);
}
