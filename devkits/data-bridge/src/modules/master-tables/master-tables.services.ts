import { request } from "../transport/index.js";
import type {
  ImportGroupPort,
  TableCatalogEntry,
  TransferSession
} from "../transfer-session/index.js";
export const masterTables: ImportGroupPort = {
  list: () => request<TransferSession[]>("/master-tables/transfers"),
  catalog: (sourceId, targetTenantId) =>
    request<TableCatalogEntry[]>(
      `/master-tables/catalog?sourceId=${sourceId}&targetTenantId=${targetTenantId}`
    ),
  create: (sourceId, targetTenantId) =>
    request<TransferSession>("/master-tables/transfers", { sourceId, targetTenantId })
};
