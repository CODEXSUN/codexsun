import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
import { referenceCollation } from "../../migration-collation.js";
export async function migrateBuyer(database: Kysely<TconnectDatabase>) {
  const userCollation = await referenceCollation(database, "app_users");
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_buyers (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,
 user_uuid VARCHAR(8) ${userCollation} NOT NULL UNIQUE,name VARCHAR(120) NOT NULL,email VARCHAR(180) NOT NULL UNIQUE,
 business_name VARCHAR(180) NOT NULL,city VARCHAR(100) NOT NULL,phone VARCHAR(30) NOT NULL,
 registration_fingerprint CHAR(64) NOT NULL,status VARCHAR(24) NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (user_uuid) REFERENCES app_users(uuid),INDEX(registration_fingerprint,created_at)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
