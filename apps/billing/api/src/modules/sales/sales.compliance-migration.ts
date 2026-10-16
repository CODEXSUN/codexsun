import { sql, type Kysely } from "kysely";
export const salesComplianceMigration = {
  key: "billing.sales.compliance-queue-v1",
  description: "Durable compliance requests, provider outcomes, cancellation history, and recovery."
};
export async function migrateSalesCompliance<Database>(database: Kysely<Database>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS billing_sales_compliance_jobs (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
 sales_id INT NOT NULL, company_id INT NOT NULL, financial_year_id INT NOT NULL,
 action VARCHAR(40) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'pending',
 actor_email VARCHAR(191) NOT NULL, snapshot_json JSON NOT NULL, result_json JSON NULL,
 attempts INT NOT NULL DEFAULT 0, lease_uuid CHAR(8) NULL, error_message TEXT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 INDEX compliance_dispatch(status,updated_at), INDEX compliance_invoice(sales_id,id),
 FOREIGN KEY (sales_id) REFERENCES billing_sales(id) ON DELETE RESTRICT
 ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
