import type { Sale } from "./sales.types.js";
import type { ComplianceParties } from "./sales.compliance-parties.js";
export type SalesComplianceAction =
  "einvoice.generate" | "eway.generate" | "einvoice.cancel" | "eway.cancel";
export type SalesComplianceJob = {
  uuid: string;
  invoiceUuid: string;
  action: SalesComplianceAction;
  status: "pending" | "running" | "review" | "failed" | "completed";
  error: string;
  attempts: number;
  companyId: number;
  financialYearId: number;
  actorEmail: string;
};
export type SalesComplianceSnapshot = {
  invoice: Sale;
  parties: ComplianceParties;
  distanceKm: number;
  reasonCode: number;
  remarks: string;
  environment: string;
  gstin: string;
  reconcileOnly?: boolean;
  billNo?: string;
};
