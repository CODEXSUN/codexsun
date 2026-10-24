import { request } from "../transport/index.js";
import type { BridgeReportSummary } from "./report.types.js";
export const listBridgeReports = () => request<BridgeReportSummary[]>("/reports");
export const latestCommonBulkReport = (
  sourceId: number,
  targetTenantId: number,
  scope: "common" | "masters" = "common"
) =>
  request<import("./report.types.js").CommonBulkReport | null>(
    `/bulk-imports/latest?sourceId=${sourceId}&targetTenantId=${targetTenantId}&scope=${scope}`
  );
export const getCommonBulkReport = (id: string) =>
  request<import("./report.types.js").CommonBulkReport>(`/bulk-imports/${id}`);

export const prepareConflictCorrection = (runId: string, table: string, sourceId: number) =>
  request<import("./report.types.js").ConflictResolution>(
    `/bulk-imports/${runId}/corrections/prepare`,
    { table, sourceId }
  );
export const commitConflictCorrection = (runId: string, planId: string, fingerprint: string) =>
  request<import("./report.types.js").ConflictResolution>(
    `/bulk-imports/${runId}/corrections/commit`,
    { planId, fingerprint, confirmed: true }
  );
