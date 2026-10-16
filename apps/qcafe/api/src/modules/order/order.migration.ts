import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
export async function migrateOrders(database: Kysely<QCafeDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_order (
 id INT AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, name VARCHAR(40) NOT NULL,
 revision INT NOT NULL DEFAULT 0, status VARCHAR(24) NOT NULL DEFAULT 'draft', mode VARCHAR(24) NOT NULL,
 table_uuid CHAR(8) NULL, table_name VARCHAR(40) NOT NULL DEFAULT '', seats_json LONGTEXT NOT NULL,
 lines_json LONGTEXT NOT NULL, bill_uuid CHAR(8) NULL UNIQUE, created_by VARCHAR(191) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(table_uuid) REFERENCES qcafe_table(uuid), FOREIGN KEY(bill_uuid) REFERENCES qcafe_pos(uuid)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_order_seats (
 table_uuid CHAR(8) NOT NULL, seat INT NOT NULL, order_uuid CHAR(8) NOT NULL,
 PRIMARY KEY(table_uuid,seat), FOREIGN KEY(table_uuid) REFERENCES qcafe_table(uuid), FOREIGN KEY(order_uuid) REFERENCES qcafe_order(uuid)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_order_tickets (
 id INT AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, order_uuid CHAR(8) NOT NULL,
 kind VARCHAR(24) NOT NULL, lines_json LONGTEXT NOT NULL, created_by VARCHAR(191) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(order_uuid) REFERENCES qcafe_order(uuid)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS qcafe_order_operations (
 request_id CHAR(36) PRIMARY KEY, order_uuid CHAR(8) NOT NULL, payload_hash CHAR(64) NOT NULL,
 response_json LONGTEXT NOT NULL, action VARCHAR(24) NOT NULL, actor VARCHAR(191) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(order_uuid) REFERENCES qcafe_order(uuid)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
