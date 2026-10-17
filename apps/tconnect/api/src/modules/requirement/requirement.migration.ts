import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function migrateRequirement(database: Kysely<TconnectDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_requirements (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,buyer_uuid CHAR(8) NOT NULL,
 title VARCHAR(180) NOT NULL,category VARCHAR(100) NOT NULL,description TEXT NOT NULL,quantity VARCHAR(100) NOT NULL,
 delivery_city VARCHAR(100) NOT NULL,budget DECIMAL(16,2) NULL,status VARCHAR(24) NOT NULL DEFAULT 'draft',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(buyer_uuid) REFERENCES tconnect_buyers(uuid),INDEX(buyer_uuid,status),INDEX(status,category)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
