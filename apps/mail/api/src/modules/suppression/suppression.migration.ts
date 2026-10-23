import { sql } from "kysely";
import { runMigrationBatch } from "@codexsun/framework/db";
import type { MailSafetyContext } from "./suppression.types.js";
async function applySchema(database: MailSafetyContext["database"]) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS mail_suppressions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,
    company_id INT NOT NULL,recipient VARCHAR(254) NOT NULL,reason VARCHAR(24) NOT NULL,
    evidence VARCHAR(500) NOT NULL,status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_by VARCHAR(191) NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX mail_suppression_subject(company_id,recipient)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

export async function migrateMailSuppressions(database: MailSafetyContext["database"]) {
  return runMigrationBatch(database, {
    batch: 1,
    scope: "mail.suppression",
    description: "Tenant-local suppression evidence.",
    version: "1",
    steps: [
      {
        name: "mail.suppression.v1",
        checksum: "mail.suppression.v1",
        version: 1,
        description: "Create suppression evidence.",
        up: applySchema
      }
    ]
  });
}
