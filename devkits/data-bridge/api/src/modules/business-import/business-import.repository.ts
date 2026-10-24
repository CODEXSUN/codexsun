import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { BusinessRun, InvoiceVerification } from "./business-import.types.js";
export class BusinessImportRepository {
  constructor(private readonly database: Kysely<unknown>) {}
  async create(run: BusinessRun) {
    await sql`INSERT INTO data_bridge_business_runs(uuid,source_id,target_tenant_id,status,report_json,created_by) VALUES(${run.id},${run.sourceId},${run.targetTenantId},${run.status},${JSON.stringify(run)},${run.actor})`.execute(
      this.database
    );
    return run;
  }
  async save(run: BusinessRun) {
    run.updatedAt = new Date().toISOString();
    await sql`UPDATE data_bridge_business_runs SET status=${run.status},report_json=${JSON.stringify(run)},updated_at=CURRENT_TIMESTAMP WHERE uuid=${run.id}`.execute(
      this.database
    );
  }
  async get(id: string) {
    const result = await sql<{
      report_json: string | BusinessRun;
    }>`SELECT report_json FROM data_bridge_business_runs WHERE uuid=${id}`.execute(this.database);
    if (!result.rows[0]) throw AppError.validation("Business import report was not found.");
    const value = result.rows[0].report_json;
    return typeof value === "string" ? (JSON.parse(value) as BusinessRun) : value;
  }
  async latest(sourceId: number, targetTenantId: number) {
    const result = await sql<{
      uuid: string;
    }>`SELECT uuid FROM data_bridge_business_runs WHERE source_id=${sourceId} AND target_tenant_id=${targetTenantId} ORDER BY id DESC LIMIT 1`.execute(
      this.database
    );
    return result.rows[0] ? this.get(result.rows[0].uuid) : null;
  }
  async active(targetTenantId: number) {
    const result = await sql<{
      uuid: string;
    }>`SELECT uuid FROM data_bridge_business_runs WHERE target_tenant_id=${targetTenantId} AND status IN ('queued','running') ORDER BY id DESC LIMIT 1`.execute(
      this.database
    );
    return result.rows[0] ? this.get(result.rows[0].uuid) : null;
  }
  async summaries() {
    const result = await sql<{
      uuid: string;
      source_database: string;
      target_database: string;
      status: string;
      updated_at: Date | string;
      table_count: number;
      row_counts: string | number[] | null;
    }>`SELECT uuid,status,updated_at,JSON_VALUE(report_json,'$.sourceDatabase') source_database,JSON_VALUE(report_json,'$.targetDatabase') target_database,JSON_LENGTH(JSON_EXTRACT(report_json,'$.tables')) table_count,JSON_EXTRACT(report_json,'$.tables[*].sourceRows') row_counts FROM data_bridge_business_runs ORDER BY id DESC`.execute(
      this.database
    );
    return result.rows;
  }
  async saveInvoice(runId: string, invoice: InvoiceVerification) {
    await sql`INSERT INTO data_bridge_business_invoices(run_uuid,table_name,source_row_id,status,body) VALUES(${runId},${invoice.table},${invoice.sourceId},${invoice.status},${JSON.stringify(invoice)}) ON DUPLICATE KEY UPDATE status=VALUES(status),body=VALUES(body)`.execute(
      this.database
    );
  }
  async invoice(runId: string, table: string, sourceId: number) {
    const result = await sql<{
      body: string | InvoiceVerification;
    }>`SELECT body FROM data_bridge_business_invoices WHERE run_uuid=${runId} AND table_name=${table} AND source_row_id=${sourceId}`.execute(
      this.database
    );
    const value = result.rows[0]?.body;
    if (!value) throw AppError.validation("Invoice verification was not found.");
    return typeof value === "string" ? (JSON.parse(value) as InvoiceVerification) : value;
  }
  async invoiceCounts(runId: string) {
    const result = await sql<{
      total: number;
      matched: number;
      warnings: number;
    }>`SELECT COUNT(*) total,COALESCE(SUM(status='success'),0) matched,COALESCE(SUM(status='warning'),0) warnings FROM data_bridge_business_invoices WHERE run_uuid=${runId}`.execute(
      this.database
    );
    return result.rows[0]!;
  }
  async invoiceWarnings(runId: string) {
    const result = await sql<{
      table_name: string;
      source_row_id: number;
      message: string;
    }>`SELECT table_name,source_row_id,JSON_VALUE(body,'$.message') message FROM data_bridge_business_invoices WHERE run_uuid=${runId} AND status='warning' ORDER BY id`.execute(
      this.database
    );
    return result.rows;
  }
  async invoices(runId: string, page: number, warningsOnly: boolean) {
    const where = warningsOnly ? sql`AND status='warning'` : sql``;
    const count = await sql<{
      total: number;
    }>`SELECT COUNT(*) total FROM data_bridge_business_invoices WHERE run_uuid=${runId} ${where}`.execute(
      this.database
    );
    const rows = await sql<{
      body: string | InvoiceVerification;
    }>`SELECT body FROM data_bridge_business_invoices WHERE run_uuid=${runId} ${where} ORDER BY id LIMIT 100 OFFSET ${(page - 1) * 100}`.execute(
      this.database
    );
    return {
      total: Number(count.rows[0]!.total),
      rows: rows.rows.map((r) =>
        typeof r.body === "string" ? (JSON.parse(r.body) as InvoiceVerification) : r.body
      )
    };
  }
}
