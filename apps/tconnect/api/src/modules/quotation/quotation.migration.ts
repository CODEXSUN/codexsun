import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function migrateQuotation(database: Kysely<TconnectDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_quotations (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,conversation_uuid CHAR(8) NOT NULL,
 quantity DECIMAL(12,3) NOT NULL,unit VARCHAR(40) NOT NULL,unit_price DECIMAL(16,2) NOT NULL,tax_percent DECIMAL(6,2) NOT NULL,
 shipping DECIMAL(16,2) NOT NULL,subtotal DECIMAL(16,2) NOT NULL,tax_amount DECIMAL(16,2) NOT NULL,total DECIMAL(16,2) NOT NULL,
 currency VARCHAR(3) NOT NULL DEFAULT 'INR',delivery_days INT NOT NULL,valid_until DATE NOT NULL,payment_terms TEXT NOT NULL,notes TEXT NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'sent',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(conversation_uuid) REFERENCES tconnect_conversations(uuid),INDEX(conversation_uuid,id)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
