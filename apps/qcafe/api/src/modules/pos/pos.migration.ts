import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";

export async function migratePos(database: Kysely<QCafeDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_pos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    request_id CHAR(36) NOT NULL UNIQUE,
    payload_hash CHAR(64) NOT NULL,
    total INT NOT NULL CHECK (total > 0),
    paid INT NOT NULL DEFAULT 0 CHECK (paid >= 0 AND paid <= total),
    status VARCHAR(24) NOT NULL DEFAULT 'open',
    created_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_pos_lines (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    pos_id INT NOT NULL,
    menu_uuid CHAR(8) NOT NULL,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(160) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
    rate INT NOT NULL CHECK (rate > 0),
    amount INT NOT NULL CHECK (amount > 0),
    FOREIGN KEY (pos_id) REFERENCES qcafe_pos(id),
    FOREIGN KEY (menu_uuid) REFERENCES qcafe_menu(uuid)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_pos_payments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    request_id CHAR(36) NOT NULL UNIQUE,
    payload_hash CHAR(64) NOT NULL,
    pos_id INT NOT NULL,
    amount INT NOT NULL CHECK (amount > 0),
    mode VARCHAR(24) NOT NULL,
    reference VARCHAR(120) NOT NULL DEFAULT '',
    created_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pos_id) REFERENCES qcafe_pos(id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_pos_activity (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    pos_id INT NOT NULL,
    actor VARCHAR(191) NOT NULL,
    action VARCHAR(24) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pos_id) REFERENCES qcafe_pos(id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

export async function migratePosOrderContext(database: Kysely<QCafeDatabase>) {
  await sql
    .raw("ALTER TABLE qcafe_pos ADD COLUMN IF NOT EXISTS service_context LONGTEXT NULL")
    .execute(database);
}

export async function migrateReceiptContext(database: Kysely<QCafeDatabase>) {
  await sql
    .raw("ALTER TABLE qcafe_pos ADD COLUMN IF NOT EXISTS receipt_context LONGTEXT NULL")
    .execute(database);
}
