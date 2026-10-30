import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
import { referenceCollation } from "../../migration-collation.js";
export async function migrateProduct(database: Kysely<TconnectDatabase>) {
  const companyCollation = await referenceCollation(database, "tconnect_companies");
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_products (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,company_uuid CHAR(8) ${companyCollation} NOT NULL,
 name VARCHAR(160) NOT NULL,category VARCHAR(80) NOT NULL,description TEXT NOT NULL,price DECIMAL(16,2) NULL,
 unit VARCHAR(40) NOT NULL,minimum_order VARCHAR(100) NOT NULL,image_data_url MEDIUMTEXT NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'active',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(company_uuid) REFERENCES tconnect_companies(uuid),INDEX(company_uuid,status)
 )`
    )
    .execute(database);
}
