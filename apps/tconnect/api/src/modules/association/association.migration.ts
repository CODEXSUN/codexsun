import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
export async function migrateAssociation(database: Kysely<TconnectDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_associations (
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
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
    )
    .execute(database);
}
