import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
import { referenceCollation } from "../../migration-collation.js";
export async function migrateCredential(database: Kysely<TconnectDatabase>) {
  const companyCollation = await referenceCollation(database, "tconnect_companies");
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_credentials (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,company_uuid CHAR(8) ${companyCollation} NOT NULL,
 kind VARCHAR(24) NOT NULL,standard_name VARCHAR(100) NOT NULL,issuer VARCHAR(180) NOT NULL,reference VARCHAR(180) NOT NULL,
 scope TEXT NOT NULL,public_evidence_url VARCHAR(1000) NOT NULL,expires_on DATE NOT NULL,private_notes TEXT NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'pending',reviewed_at DATETIME NULL,reviewed_by VARCHAR(180) NOT NULL DEFAULT '',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(company_uuid) REFERENCES tconnect_companies(uuid),UNIQUE KEY credential_reference(company_uuid,kind,standard_name,reference),INDEX(company_uuid,status,expires_on)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
