import { request } from "../transport/index.js";
import type {
  ImportGroupPort,
  TableCatalogEntry,
  TransferSession
} from "../transfer-session/index.js";
export const commonTables: ImportGroupPort = {
  list: () => request<TransferSession[]>("/common-tables/transfers"),
  catalog: (sourceId, targetTenantId) =>
    request<TableCatalogEntry[]>(
      `/common-tables/catalog?sourceId=${sourceId}&targetTenantId=${targetTenantId}`
    ),
  create: (sourceId, targetTenantId) =>
    request<TransferSession>("/common-tables/transfers", { sourceId, targetTenantId })
};
