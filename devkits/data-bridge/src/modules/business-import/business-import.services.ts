import { request } from "../transport/index.js";
import type {
  BusinessReport,
  BusinessRow,
  BusinessInvoice,
  BusinessWarning,
  ReportPage,
  InvoiceSelection
} from "./business-import.types.js";
export const startBusinessImport = (sourceId: number, targetTenantId: number) =>
  request<BusinessReport>("/business-imports", { sourceId, targetTenantId, confirmed: true });
export const getBusinessImport = (id: string) => request<BusinessReport>(`/business-imports/${id}`);
export const getBusinessRows = (
  id: string,
  table: string,
  page: number,
  status: string,
  invoice?: InvoiceSelection
) =>
  request<ReportPage<BusinessRow>>(
    `/business-imports/${id}/rows?table=${encodeURIComponent(table)}&page=${page}&status=${status}${invoice ? `&invoiceTable=${encodeURIComponent(invoice.table)}&invoiceSourceId=${invoice.sourceId}` : ""}`
  );
export const getBusinessInvoices = (id: string, page: number, warningsOnly: boolean) =>
  request<ReportPage<BusinessInvoice>>(
    `/business-imports/${id}/invoices?page=${page}&warningsOnly=${warningsOnly}`
  );
export const getBusinessWarnings = (id: string, page: number) =>
  request<ReportPage<BusinessWarning>>(`/business-imports/${id}/warnings?page=${page}`);
