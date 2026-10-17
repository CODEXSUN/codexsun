import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
export async function migrateSpecials(database: Kysely<QCafeDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_special_settings (
    id INT NOT NULL PRIMARY KEY CHECK (id = 1), revision INT NOT NULL DEFAULT 0,
    payload LONGTEXT NOT NULL CHECK (JSON_VALID(payload)), updated_by VARCHAR(191) NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_special_activity (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, actor VARCHAR(191) NOT NULL,
    revision INT NOT NULL, payload LONGTEXT NOT NULL CHECK (JSON_VALID(payload)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
