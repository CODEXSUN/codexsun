import { runMigrationBatch } from "@codexsun/framework/db";
import { sql, type Kysely } from "kysely";
import type { LeadDatabase } from "./lead.types.js";
async function createLeadSchema(database: Kysely<LeadDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS crm_leads (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, company_id INT NOT NULL,
 submission_uuid CHAR(8) NOT NULL, campaign_uuid CHAR(8) NOT NULL, campaign_label VARCHAR(160) NOT NULL,
 name VARCHAR(160) NOT NULL, email VARCHAR(254) NOT NULL, phone VARCHAR(40) NOT NULL, message TEXT NOT NULL, source VARCHAR(160) NOT NULL,
 assigned_to VARCHAR(191) NOT NULL, payload_hash CHAR(64) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'review', task_id INT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY crm_lead_source(company_id,submission_uuid)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

export const leadMigrationBatch = {
  batch: 1,
  scope: "crm.lead",
  description: "Local CRM Marketing Lead intake.",
  version: "1.1.46",
  steps: [
    {
      name: "crm.lead.intake.v1",
      checksum: "crm.lead.intake.v1",
      description: "CRM Leads with source receipt and follow-up link.",
      version: 1,
      up: createLeadSchema
    }
  ]
};
export const migrateLead = (database: Kysely<LeadDatabase>) =>
  runMigrationBatch(database, leadMigrationBatch);
