import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { currentBillingScope } from "../../auth/billing-scope.js";
import { runBillingTransaction } from "../../database/billing-database.js";
import { exportSalesDatabase } from "./export-sales.repository-support.js";
import type {
  ExportSalesComplianceAction,
  ExportSalesComplianceJob,
  ExportSalesComplianceSnapshot
} from "./export-sales.compliance-types.js";

type Row = {
  uuid: string;
  invoice_uuid: string;
  action: ExportSalesComplianceAction;
  status: ExportSalesComplianceJob["status"];
  error_message: string | null;
  attempts: number;
  company_id: number;
  financial_year_id: number;
  actor_email: string;
  snapshot_json: ExportSalesComplianceSnapshot | string;
  result_json: Record<string, unknown> | string | null;
  lease_uuid: string | null;
};
export class ExportSalesComplianceRepository {
  async request(
    databaseName: string,
    snapshot: ExportSalesComplianceSnapshot,
    action: ExportSalesComplianceAction
  ): Promise<ExportSalesComplianceJob> {
    const db = await exportSalesDatabase(databaseName),
      scope = currentBillingScope();
    return runBillingTransaction(db, async (tx) => {
      const invoice = await sql<{
        id: number;
      }>`SELECT id FROM billing_export_sales WHERE uuid=${snapshot.invoice.id} AND company_id=${scope.companyId} AND financial_year_id=${scope.financialYearId} AND status='confirmed' AND deleted_at IS NULL FOR UPDATE`.execute(
        tx
      );
      if (!invoice.rows[0])
        throw AppError.conflict(
          "Only confirmed invoices in the active scope can submit compliance."
        );
      const active = await sql<{
        uuid: string;
        action: string;
      }>`SELECT uuid,action FROM billing_export_sales_compliance_jobs WHERE export_sale_id=${invoice.rows[0].id} AND status IN ('pending','running','review') ORDER BY id DESC LIMIT 1`.execute(
        tx
      );
      if (active.rows[0]) {
        if (active.rows[0].action !== action)
          throw AppError.conflict(
            "Resolve the pending compliance request before another operation."
          );
        return this.read(databaseName, active.rows[0].uuid, snapshot.invoice.id, tx);
      }
      const uuid = randomBytes(4).toString("hex");
      await sql`INSERT INTO billing_export_sales_compliance_jobs (uuid,export_sale_id,company_id,financial_year_id,action,actor_email,snapshot_json) VALUES (${uuid},${invoice.rows[0].id},${scope.companyId},${scope.financialYearId},${action},${scope.actorEmail || ""},${JSON.stringify(snapshot)})`.execute(
        tx
      );
      return this.read(databaseName, uuid, snapshot.invoice.id, tx);
    });
  }
  async read(
    databaseName: string,
    uuid: string,
    invoiceUuid?: string,
    database?: Kysely<Record<string, never>>
  ): Promise<ExportSalesComplianceJob> {
    const row = await this.row(databaseName, uuid, database);
    const scope = currentBillingScope();
    if (
      !row ||
      (invoiceUuid && row.invoice_uuid !== invoiceUuid) ||
      row.company_id !== scope.companyId ||
      row.financial_year_id !== scope.financialYearId
    )
      throw AppError.notFound("Compliance request not found.");
    return publicJob(row);
  }
  async list(databaseName: string, invoiceUuid: string): Promise<ExportSalesComplianceJob[]> {
    const db = await exportSalesDatabase(databaseName),
      scope = currentBillingScope();
    const rows =
      await sql<Row>`SELECT j.*,i.uuid AS invoice_uuid FROM billing_export_sales_compliance_jobs j INNER JOIN billing_export_sales i ON i.id=j.export_sale_id WHERE i.uuid=${invoiceUuid} AND j.company_id=${scope.companyId} AND j.financial_year_id=${scope.financialYearId} ORDER BY j.id DESC LIMIT 20`.execute(
        db
      );
    return rows.rows.map(publicJob);
  }
  async dispatchable(databaseName: string) {
    const db = await exportSalesDatabase(databaseName);
    await sql`UPDATE billing_export_sales_compliance_jobs SET status='pending',lease_uuid=NULL,snapshot_json=JSON_SET(snapshot_json,'$.reconcileOnly',true),error_message='Recovering interrupted worker through provider lookup.' WHERE status='running' AND updated_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 5 MINUTE) AND (result_json IS NOT NULL OR action<>'eway.generate' OR COALESCE(JSON_UNQUOTE(JSON_EXTRACT(snapshot_json,'$.invoice.einvoice.irn')),'')<>'')`.execute(
      db
    );
    await sql`UPDATE billing_export_sales_compliance_jobs SET status='review',lease_uuid=NULL,error_message='Worker stopped before recording an outcome. Check provider status before retrying.' WHERE status='running' AND updated_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 5 MINUTE)`.execute(
      db
    );
    const result =
      await sql<Row>`SELECT j.*,i.uuid AS invoice_uuid FROM billing_export_sales_compliance_jobs j INNER JOIN billing_export_sales i ON i.id=j.export_sale_id WHERE j.status='pending' ORDER BY j.id LIMIT 20`.execute(
        db
      );
    return result.rows.map(publicJob);
  }
  async claim(databaseName: string, uuid: string) {
    const db = await exportSalesDatabase(databaseName);
    return runBillingTransaction(db, async (tx) => {
      const row = await this.row(databaseName, uuid, tx);
      if (!row) return null;
      await sql`SELECT id FROM billing_export_sales WHERE uuid=${row.invoice_uuid} FOR UPDATE`.execute(
        tx
      );
      const lease = randomBytes(4).toString("hex");
      const changed =
        await sql`UPDATE billing_export_sales_compliance_jobs SET status='running',lease_uuid=${lease},attempts=attempts+1,error_message=NULL WHERE uuid=${uuid} AND status='pending'`.execute(
          tx
        );
      if (!Number(changed.numAffectedRows)) return null;
      return {
        job: publicJob(row),
        snapshot: parse<ExportSalesComplianceSnapshot>(row.snapshot_json),
        result: row.result_json ? parse<Record<string, unknown>>(row.result_json) : null,
        lease
      };
    });
  }
  async saveResult(
    databaseName: string,
    uuid: string,
    lease: string,
    result: Record<string, unknown>
  ) {
    const db = await exportSalesDatabase(databaseName);
    const saved =
      await sql`UPDATE billing_export_sales_compliance_jobs SET result_json=${JSON.stringify(result)},updated_at=UTC_TIMESTAMP(3) WHERE uuid=${uuid} AND lease_uuid=${lease} AND status='running'`.execute(
        db
      );
    if (!Number(saved.numAffectedRows)) throw AppError.conflict("Compliance worker lease expired.");
  }
  async finish(
    databaseName: string,
    uuid: string,
    lease: string,
    status: ExportSalesComplianceJob["status"],
    error = ""
  ) {
    const db = await exportSalesDatabase(databaseName);
    await sql`UPDATE billing_export_sales_compliance_jobs SET status=${status},error_message=${error},lease_uuid=NULL WHERE uuid=${uuid} AND lease_uuid=${lease} AND status='running'`.execute(
      db
    );
  }
  async reconcile(databaseName: string, invoiceUuid: string, uuid: string, billNo?: string) {
    await this.read(databaseName, uuid, invoiceUuid);
    const db = await exportSalesDatabase(databaseName);
    await runBillingTransaction(db, async (tx) => {
      const row = await this.row(databaseName, uuid, tx);
      if (!row || row.status !== "review")
        throw AppError.conflict("Only an uncertain request can be reconciled.");
      const snapshot = parse<ExportSalesComplianceSnapshot>(row.snapshot_json);
      await sql`UPDATE billing_export_sales_compliance_jobs SET status='pending',snapshot_json=${JSON.stringify({ ...snapshot, reconcileOnly: true, billNo })},error_message=NULL WHERE uuid=${uuid} AND status='review'`.execute(
        tx
      );
    });
    return this.read(databaseName, uuid, invoiceUuid);
  }
  private async row(databaseName: string, uuid: string, db?: Kysely<Record<string, never>>) {
    const result =
      await sql<Row>`SELECT j.*,i.uuid AS invoice_uuid FROM billing_export_sales_compliance_jobs j INNER JOIN billing_export_sales i ON i.id=j.export_sale_id WHERE j.uuid=${uuid} FOR UPDATE`.execute(
        db ?? (await exportSalesDatabase(databaseName))
      );
    return result.rows[0];
  }
}
function publicJob(row: Row): ExportSalesComplianceJob {
  return {
    uuid: row.uuid,
    invoiceUuid: row.invoice_uuid,
    action: row.action,
    status: row.status,
    error: row.error_message ?? "",
    attempts: row.attempts,
    companyId: row.company_id,
    financialYearId: row.financial_year_id,
    actorEmail: row.actor_email
  };
}
function parse<T>(value: T | string): T {
  return typeof value === "string" ? JSON.parse(value) : value;
}

export async function assertExportSalesComplianceUnlocked<Database>(
  db: Kysely<Database>,
  invoiceId: number
) {
  await sql`SELECT id FROM billing_export_sales WHERE id=${invoiceId} FOR UPDATE`.execute(db);
  const scope = currentBillingScope();
  const jobs = await sql<{
    uuid: string;
    lease_uuid: string | null;
  }>`SELECT uuid,lease_uuid FROM billing_export_sales_compliance_jobs WHERE export_sale_id=${invoiceId} AND status IN ('pending','running','review')`.execute(
    db
  );
  if (
    jobs.rows.some(
      (job) => job.uuid !== scope.complianceJobUuid || job.lease_uuid !== scope.complianceLease
    )
  )
    throw AppError.conflict(
      "A compliance request is pending or needs reconciliation. Resolve it before changing this invoice."
    );
}
