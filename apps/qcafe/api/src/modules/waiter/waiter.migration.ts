import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
export async function migrateWaiters(db: Kysely<QCafeDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_waiter (
 uuid CHAR(8) PRIMARY KEY, code VARCHAR(24) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL,
 status VARCHAR(16) NOT NULL DEFAULT 'active', updated_by VARCHAR(191) NOT NULL,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(db);
}
