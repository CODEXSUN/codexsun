import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function migrateMember(database: Kysely<TconnectDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_members (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
 user_uuid VARCHAR(8) NOT NULL UNIQUE, company_uuid CHAR(8) NOT NULL UNIQUE,
 name VARCHAR(180) NOT NULL,email VARCHAR(180) NOT NULL UNIQUE, account_type VARCHAR(24) NOT NULL,
 requested_association_uuid CHAR(8) NULL,membership_number VARCHAR(80) NOT NULL DEFAULT '',
 membership_status VARCHAR(24) NOT NULL DEFAULT 'none', registration_fingerprint CHAR(64) NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'active',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (user_uuid) REFERENCES app_users(uuid),FOREIGN KEY (company_uuid) REFERENCES tconnect_companies(uuid),
 FOREIGN KEY (requested_association_uuid) REFERENCES tconnect_associations(uuid),INDEX (registration_fingerprint,created_at)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
