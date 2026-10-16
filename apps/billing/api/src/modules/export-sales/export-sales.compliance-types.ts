import type { ExportSale } from "./export-sales.types.js";
import type { ComplianceParties } from "./export-sales.compliance-parties.js";
export type ExportSalesComplianceAction =
  "einvoice.generate" | "eway.generate" | "einvoice.cancel" | "eway.cancel";
export type ExportSalesComplianceJob = {
  uuid: string;
  invoiceUuid: string;
  action: ExportSalesComplianceAction;
  status: "pending" | "running" | "review" | "failed" | "completed";
  error: string;
  attempts: number;
  companyId: number;
  financialYearId: number;
  actorEmail: string;
};
export type ExportSalesComplianceSnapshot = {
  invoice: ExportSale;
  parties: ComplianceParties;
  distanceKm: number;
  reasonCode: number;
  remarks: string;
  environment: string;
  gstin: string;
  reconcileOnly?: boolean;
  billNo?: string;
};
