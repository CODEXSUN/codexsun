import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
import { referenceCollation } from "../../migration-collation.js";
export async function migrateInquiry(database: Kysely<TconnectDatabase>) {
  const companyCollation = await referenceCollation(database, "tconnect_companies");
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_inquiries (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
 companyUuid CHAR(8) ${companyCollation} NOT NULL, buyerName VARCHAR(120) NOT NULL, email VARCHAR(191) NOT NULL,
 phone VARCHAR(30) NOT NULL, requirement TEXT NOT NULL, quantity VARCHAR(100) NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'new', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (companyUuid) REFERENCES tconnect_companies(uuid), INDEX (created_at), INDEX (companyUuid, status)
 )`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_activity (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
 resource VARCHAR(40) NOT NULL, record_uuid CHAR(8) NOT NULL, actor VARCHAR(191) NOT NULL,
 action VARCHAR(40) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
 )`
    )
    .execute(database);
}
