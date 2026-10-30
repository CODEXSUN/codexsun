import { request } from "../transport/index.js";
import type {
  CommonTableImportSummary,
  CommonTablePreview,
  CommonTableImportDetail
} from "./import-review.types.js";
export const listCommonTableImports = () => request<CommonTableImportSummary[]>("/imports");
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
  request<import("./import-review.types.js").ImportReport>(`/imports/${id}/audit`, {});
