import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
export async function migrateTables(database: Kysely<QCafeDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_table (
 id INT AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, name VARCHAR(40) NOT NULL UNIQUE,
 seats INT NOT NULL CHECK(seats BETWEEN 1 AND 50), status VARCHAR(24) NOT NULL DEFAULT 'active',
 created_by VARCHAR(191) NOT NULL, updated_by VARCHAR(191) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_table_activity (
 id INT AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, table_uuid CHAR(8) NOT NULL,
 actor VARCHAR(191) NOT NULL, action VARCHAR(24) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(table_uuid) REFERENCES qcafe_table(uuid)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
