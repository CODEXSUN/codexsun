import { request } from "../transport/index.js";
import type {
  ImportGroupPort,
  TableCatalogEntry,
  TransferSession
} from "../transfer-session/index.js";
export const billingTables: ImportGroupPort = {
  list: () => request<TransferSession[]>("/billing-tables/transfers"),
  catalog: (sourceId, targetTenantId) =>
    request<TableCatalogEntry[]>(
      `/billing-tables/catalog?sourceId=${sourceId}&targetTenantId=${targetTenantId}`
    ),
  create: (sourceId, targetTenantId) =>
    request<TransferSession>("/billing-tables/transfers", { sourceId, targetTenantId })
};
