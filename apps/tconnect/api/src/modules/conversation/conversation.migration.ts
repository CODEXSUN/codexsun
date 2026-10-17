import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function migrateConversation(database: Kysely<TconnectDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_conversations (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,buyer_uuid CHAR(8) NOT NULL,company_uuid CHAR(8) NOT NULL,
 requirement_uuid CHAR(8) NULL,inquiry_uuid CHAR(8) NULL,status VARCHAR(24) NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(buyer_uuid) REFERENCES tconnect_buyers(uuid),FOREIGN KEY(company_uuid) REFERENCES tconnect_companies(uuid),
 FOREIGN KEY(requirement_uuid) REFERENCES tconnect_requirements(uuid),FOREIGN KEY(inquiry_uuid) REFERENCES tconnect_inquiries(uuid),
 UNIQUE KEY uq_tconnect_requirement_seller(requirement_uuid,company_uuid),UNIQUE KEY uq_tconnect_inquiry_thread(inquiry_uuid),
 INDEX(buyer_uuid,updated_at),INDEX(company_uuid,updated_at),CHECK((requirement_uuid IS NULL) <> (inquiry_uuid IS NULL))
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
