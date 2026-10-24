import type {
  CommonTableImportDetail,
  CommonTableImportSummary,
  CommonTableOption,
  CommonTablePreview,
  DataBridgeSource,
  DataBridgeTenant
} from "./common-table-import.types.js";

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string }; meta?: { requestId?: string } };

export async function request<T>(path: string, body?: unknown) {
  const slot = sessionStorage.getItem("codexsun.auth.slot");
  const response = await fetch(`/api/data-bridge${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(slot ? { "x-codexsun-session-slot": slot } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const responseText = await response.text();
    if (/^\s*<!doctype html|^\s*<html/iu.test(responseText)) {
      throw new Error(
        "The Data Bridge API returned the web app page instead of JSON. Check that the Platform API is running and the /api/data-bridge proxy is active."
      );
    }
    throw new Error(`The Data Bridge API returned a non-JSON response (${response.status}).`);
  }
  let envelope: Envelope<T>;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    throw new Error(`The Data Bridge API returned invalid JSON (${response.status}).`);
  }
  if (!response.ok || !envelope.success) {
    const message = envelope.success
      ? `Request failed (${response.status}).`
      : envelope.error.message;
    const requestId = envelope.success ? undefined : envelope.meta?.requestId;
    throw new Error(requestId ? `${message} (Request ID: ${requestId})` : message);
  }
  return envelope.data;
}

export const listDataBridgeSources = () => request<DataBridgeSource[]>("/sources");
export const listDataBridgeTenants = () => request<DataBridgeTenant[]>("/tenants");
export const listCommonTableImports = () => request<CommonTableImportSummary[]>("/imports");
export const listCommonTables = (
  sourceId: number,
  targetTenantId: number,
  scope: "common" | "masters" = "common"
) =>
  request<CommonTableOption[]>(
    `/common-tables?sourceId=${sourceId}&targetTenantId=${targetTenantId}&scope=${scope}`
  );
export const previewCommonTable = (
  sourceId: number,
  targetTenantId: number,
  table: string,
  page: number
) =>
  request<CommonTablePreview>(
    `/common-tables/${encodeURIComponent(table)}/data?sourceId=${sourceId}&targetTenantId=${targetTenantId}&page=${page}`
  );
export const getCommonTableImport = (id: string) =>
  request<CommonTableImportDetail>(`/imports/${id}`);
export const getCommonTableImportRows = (id: string, page: number) =>
  request<Array<{ rowNumber: number; data: Record<string, unknown> }>>(
    `/imports/${id}/rows?page=${page}`
  );
export const saveCommonTableImport = (
  sourceId: number,
  targetTenantId: number,
  table: string,
  rowIds: number[],
  columns: string[]
) =>
  request<{ id: string; status: "reviewed"; rows: number }>("/imports", {
    sourceId,
    targetTenantId,
    table,
    rowIds,
    columns
  });
export const runCommonTableImport = (id: string) =>
  request<{ imported: number; skipped: number; status: "imported" }>(`/imports/${id}/run`, {});
export const auditCommonTableImport = (id: string) =>
  request<import("./common-table-import.types.js").ImportReport>(`/imports/${id}/audit`, {});
export const startCommonBulkImport = (
  sourceId: number,
  targetTenantId: number,
  scope: "common" | "masters" = "common"
) =>
  request<import("./common-table-import.types.js").CommonBulkReport>("/bulk-imports", {
    sourceId,
    targetTenantId,
    scope
  });
export const latestCommonBulkReport = (
  sourceId: number,
  targetTenantId: number,
  scope: "common" | "masters" = "common"
) =>
  request<import("./common-table-import.types.js").CommonBulkReport | null>(
    `/bulk-imports/latest?sourceId=${sourceId}&targetTenantId=${targetTenantId}&scope=${scope}`
  );
export const getCommonBulkReport = (id: string) =>
  request<import("./common-table-import.types.js").CommonBulkReport>(`/bulk-imports/${id}`);

export const prepareConflictCorrection = (runId: string, table: string, sourceId: number) =>
  request<import("./common-table-import.types.js").ConflictResolution>(
    `/bulk-imports/${runId}/corrections/prepare`,
    { table, sourceId }
  );
export const commitConflictCorrection = (runId: string, planId: string, fingerprint: string) =>
  request<import("./common-table-import.types.js").ConflictResolution>(
    `/bulk-imports/${runId}/corrections/commit`,
    { planId, fingerprint, confirmed: true }
  );
