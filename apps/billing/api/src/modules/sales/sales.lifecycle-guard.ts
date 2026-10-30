import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { currentBillingScope } from "../../auth/billing-scope.js";

export async function assertSalesInvoiceEditable<Database>(
  db: Kysely<Database>,
  invoiceId: number,
  expectedStatus: string
) {
  const scope = currentBillingScope();
  const result = await sql<{ status: string; has_compliance: number }>`SELECT status,
    (EXISTS(SELECT 1 FROM billing_sales_einvoices e WHERE e.sales_id=i.id AND COALESCE(e.irn,'')<>'')
      OR EXISTS(SELECT 1 FROM billing_sales_eway_bills e WHERE e.sales_id=i.id AND e.status IN ('generated','cancelled'))) AS has_compliance
    FROM billing_sales i WHERE i.id=${invoiceId} AND i.company_id=${scope.companyId}
      AND i.financial_year_id=${scope.financialYearId} AND i.deleted_at IS NULL FOR UPDATE`.execute(
    db
  );
  if (result.rows[0]?.status !== expectedStatus)
    throw AppError.conflict("Invoice status changed. Refresh and try again.");
  if (result.rows[0].has_compliance)
    throw AppError.conflict("Invoices with generated compliance cannot be edited.");
}

export async function assertSalesInvoiceStatusChange<Database>(
  db: Kysely<Database>,
  id: number,
  previousStatus: string,
  nextStatus: string
) {
  const scope = currentBillingScope();
  const result = await sql<{
    status: string;
    has_irn: number;
    active_compliance: number;
  }>`SELECT status,
    EXISTS(SELECT 1 FROM billing_sales_einvoices e WHERE e.sales_id=i.id AND COALESCE(e.irn,'')<>'') AS has_irn,
    (EXISTS(SELECT 1 FROM billing_sales_einvoices e WHERE e.sales_id=i.id AND COALESCE(e.irn,'')<>'' AND e.status<>'cancelled')
      OR EXISTS(SELECT 1 FROM billing_sales_eway_bills e WHERE e.sales_id=i.id AND e.status='generated')) AS active_compliance
    FROM billing_sales i WHERE i.id=${id} AND i.company_id=${scope.companyId}
      AND i.financial_year_id=${scope.financialYearId} AND i.deleted_at IS NULL FOR UPDATE`.execute(
    db
  );
  const row = result.rows[0];
  if (
    !row ||
    row.status !== previousStatus ||
    (nextStatus === "confirmed" && row.status !== "draft") ||
    nextStatus === row.status
  )
    throw AppError.conflict("Invoice status changed. Refresh and try again.");
  if (row.active_compliance || (nextStatus === "draft" && row.has_irn))
    throw AppError.conflict(
      "Cancel the compliance documents with the provider before changing this invoice status."
    );
}
