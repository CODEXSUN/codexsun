import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
import { referenceCollation } from "../../migration-collation.js";
export async function migrateCommunity(database: Kysely<TconnectDatabase>) {
  const associationCollation = await referenceCollation(database, "tconnect_associations");
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_community (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(24) NOT NULL,
    associationUuid CHAR(8) ${associationCollation} NOT NULL,
    eventDate DATE NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (associationUuid) REFERENCES tconnect_associations(uuid)
  )`
    )
    .execute(database);
}
