import { sql } from "kysely";
import { runMigrationBatch } from "@codexsun/framework/db";
import type { ContactPolicyContext } from "./contact-restriction.types.js";
async function applySchema(database: ContactPolicyContext["database"]) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS crm_contact_restrictions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,
    company_id INT NOT NULL,recipient VARCHAR(254) NOT NULL,channel VARCHAR(24) NOT NULL DEFAULT 'email',
    blocked BOOLEAN NOT NULL,reason VARCHAR(500) NOT NULL,status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_by VARCHAR(191) NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX crm_restriction_subject(company_id,recipient,channel,id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

export async function migrateContactRestrictions(database: ContactPolicyContext["database"]) {
  return runMigrationBatch(database, {
    batch: 1,
    scope: "crm.contact-restriction",
    description: "Tenant-local contact-restriction evidence.",
    version: "1",
    steps: [
      {
        name: "crm.contact-restriction.v1",
        checksum: "crm.contact-restriction.v1",
        version: 1,
        description: "Create contact-restriction evidence.",
        up: applySchema
      }
    ]
  });
}
