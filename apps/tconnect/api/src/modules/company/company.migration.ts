import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
import { referenceCollation } from "../../migration-collation.js";
export async function migrateCompany(database: Kysely<TconnectDatabase>) {
  const associationCollation = await referenceCollation(database, "tconnect_associations");
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_companies (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    tagline VARCHAR(240) NOT NULL,
    description TEXT NOT NULL,
    industry VARCHAR(80) NOT NULL,
    city VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    initials VARCHAR(4) NOT NULL,
    role VARCHAR(24) NOT NULL,
    products VARCHAR(1000) NOT NULL,
    capacity VARCHAR(240) NOT NULL,
    established INT NOT NULL,
    associationUuid CHAR(8) ${associationCollation} NULL,
    website VARCHAR(500) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (associationUuid) REFERENCES tconnect_associations(uuid)
  )`
    )
    .execute(database);
}
