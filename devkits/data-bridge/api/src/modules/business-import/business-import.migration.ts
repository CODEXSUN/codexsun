import { sql, type Kysely } from "kysely";
export async function migrateBusinessImport<Database>(database: Kysely<Database>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_bridge_business_runs (
    id INT AUTO_INCREMENT PRIMARY KEY,uuid CHAR(36) NOT NULL UNIQUE,
    source_id INT NOT NULL,target_tenant_id INT NOT NULL,status VARCHAR(24) NOT NULL,
    report_json JSON NOT NULL,created_by VARCHAR(191) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX bridge_business_pair(source_id,target_tenant_id,id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS data_bridge_business_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,run_uuid CHAR(36) NOT NULL,table_name VARCHAR(191) NOT NULL,
    source_row_id INT NOT NULL,status VARCHAR(24) NOT NULL,body JSON NOT NULL,
    UNIQUE KEY bridge_invoice_row(run_uuid,table_name,source_row_id),
    INDEX bridge_invoice_status(run_uuid,status,id),
    FOREIGN KEY(run_uuid) REFERENCES data_bridge_business_runs(uuid) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    )
    .execute(database);
}
