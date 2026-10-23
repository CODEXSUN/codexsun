import { request } from "./common-table-import.services.js";
import type {
  TransferSession,
  TransferColumn,
  TransferField
} from "./common-table-import.transfer.types.js";
export const transfers = {
  list: () => request<TransferSession[]>("/transfers"),
  create: (sourceId: number, targetTenantId: number) =>
    request<TransferSession>("/transfers", { sourceId, targetTenantId }),
  get: (id: string) => request<TransferSession>(`/transfers/${id}`),
  inspect: (id: string) =>
    request<{
      tables: { source: string[]; target: string[] };
      schema: { source: TransferColumn[]; target: TransferColumn[]; hash: string } | null;
    }>(`/transfers/${id}/inspect`),
  tables: (id: string, revision: number, sourceTable: string, targetTable: string) =>
    request<TransferSession>(`/transfers/${id}/tables`, { revision, sourceTable, targetTable }),
  fields: (id: string, revision: number, fields: TransferField[]) =>
    request<TransferSession>(`/transfers/${id}/fields`, { revision, fields }),
  preview: (id: string, page: number) =>
    request<{ rows: Record<string, unknown>[]; total: number }>(
      `/transfers/${id}/preview?page=${page}`
    ),
  parents: (id: string, field: string) =>
    request<Array<{ id: number; label: string }>>(
      `/transfers/${id}/parents?field=${encodeURIComponent(field)}`
    ),
  prepare: (id: string, revision: number, ids: number[]) =>
    request<TransferSession>(`/transfers/${id}/prepare`, { revision, ids }),
  commit: (id: string, revision: number) =>
    request<TransferSession>(`/transfers/${id}/commit`, { revision, confirmed: true })
};
