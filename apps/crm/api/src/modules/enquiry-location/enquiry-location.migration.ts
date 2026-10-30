import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { EnquiryLocationDatabase } from "./enquiry-location.types.js";

export const enquiryLocationMigrationBatch: MigrationBatch<EnquiryLocationDatabase> = {
  batch: 1,
  description: "CRM enquiry GPS location history.",
  scope: "crm.enquiry-location",
  version: "1.0.97",
  steps: [
    {
      name: "crm.enquiry-location.history-v1",
      description: "Store multiple GPS location captures per enquiry and contact.",
      checksum: "crm.enquiry-location.history-v1:v1",
      version: 1,
      up: async (database) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_enquiry_locations (
              id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
              uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
              enquiry_id INT NOT NULL,
              contact_id INT NULL,
              latitude DECIMAL(10,7) NOT NULL,
              longitude DECIMAL(10,7) NOT NULL,
              accuracy_meters DECIMAL(10,2) NULL,
              captured_at DATETIME NOT NULL,
              created_by VARCHAR(191) NOT NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX crm_enquiry_locations_enquiry_capture (enquiry_id, captured_at, id),
              INDEX crm_enquiry_locations_contact_capture (contact_id, captured_at, id),
              CONSTRAINT crm_enquiry_locations_enquiry_fk FOREIGN KEY (enquiry_id) REFERENCES crm_enquiries (id) ON DELETE RESTRICT,
              CONSTRAINT crm_enquiry_locations_contact_fk FOREIGN KEY (contact_id) REFERENCES core_contacts (id) ON DELETE SET NULL
            ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(database);
      }
    }
  ]
};

export const migrateEnquiryLocationModule = (database: Kysely<EnquiryLocationDatabase>) =>
  runMigrationBatch(database, enquiryLocationMigrationBatch);
