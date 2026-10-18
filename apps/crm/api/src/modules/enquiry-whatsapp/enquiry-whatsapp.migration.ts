import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { WhatsAppDatabase } from "./enquiry-whatsapp.types.js";
export const enquiryWhatsAppMigrationBatch: MigrationBatch<WhatsAppDatabase> = {
  batch: 1,
  scope: "crm.enquiry-whatsapp",
  version: "1.1.8",
  description: "Audit WhatsApp handoffs for enquiries.",
  steps: [
    {
      name: "crm.enquiry-whatsapp.messages-v1",
      checksum: "crm.enquiry-whatsapp.messages-v1:v1",
      version: 1,
      description: "Store author, recipient, message, and UTC handoff time.",
      up: async (db) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_enquiry_whatsapp_messages (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, enquiry_id INT NOT NULL,
 recipient VARCHAR(24) NOT NULL, message TEXT NOT NULL, request_id VARCHAR(80) NOT NULL,
 created_by VARCHAR(191) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY crm_whatsapp_retry (created_by, request_id), INDEX crm_whatsapp_enquiry (enquiry_id,id),
 CONSTRAINT crm_whatsapp_enquiry_fk FOREIGN KEY (enquiry_id) REFERENCES crm_enquiries(id) ON DELETE RESTRICT
 ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(db);
      }
    }
  ]
};
export const migrateEnquiryWhatsApp = (db: Kysely<WhatsAppDatabase>) =>
  runMigrationBatch(db, enquiryWhatsAppMigrationBatch);
