import { formatDate as formatWorkspaceDate } from "@codexsun/ui/workspace";
import type {
  LogicxErpSchemeActivity,
  LogicxErpSchemeFilters,
  LogicxErpSchemeInvoiceOption,
  LogicxErpSchemeLookups,
  LogicxErpSchemeRecord,
  LogicxErpSchemeSavePayload,
  LogicxErpSchemeStatus
} from "./scheme.types";

export type LogicxErpSchemeRequestOptions = {
  method?: "DELETE" | "GET" | "POST" | "PUT";
  body?: unknown;
};

export type LogicxErpSchemeRequest = <T>(
  path: string,
  options?: LogicxErpSchemeRequestOptions
) => Promise<T>;

export type LogicxErpSchemeGateway = {
  list: (filters: LogicxErpSchemeFilters) => Promise<LogicxErpSchemeRecord[]>;
  get: (id: string) => Promise<LogicxErpSchemeRecord>;
  activity: (id: string) => Promise<LogicxErpSchemeActivity[]>;
  lookups: () => Promise<LogicxErpSchemeLookups>;
  invoices: (search: string) => Promise<LogicxErpSchemeInvoiceOption[]>;
  create: (payload: LogicxErpSchemeSavePayload) => Promise<LogicxErpSchemeRecord>;
  update: (id: string, payload: LogicxErpSchemeSavePayload) => Promise<LogicxErpSchemeRecord>;
  setStatus: (id: string, status: LogicxErpSchemeStatus) => Promise<LogicxErpSchemeRecord>;
  remove: (id: string) => Promise<LogicxErpSchemeRecord>;
};

const basePath = "/logicx-erp/schemes";

export function createLogicxErpSchemeGateway(
  request: LogicxErpSchemeRequest
): LogicxErpSchemeGateway {
  const recordPath = (id: string) => `${basePath}/${encodeURIComponent(id)}`;
  return {
    list: (filters) => {
      const query = new URLSearchParams({
        claim: filters.claim,
        priority: filters.priority,
        status: filters.status
      });
      if (filters.search.trim()) query.set("search", filters.search.trim());
      return request<LogicxErpSchemeRecord[]>(`${basePath}?${query}`);
    },
    get: (id) => request<LogicxErpSchemeRecord>(recordPath(id)),
    activity: (id) => request<LogicxErpSchemeActivity[]>(`${recordPath(id)}/activity`),
    lookups: () => request<LogicxErpSchemeLookups>(`${basePath}/lookups`),
    invoices: (search) =>
      request<LogicxErpSchemeInvoiceOption[]>(
        `${basePath}/lookups/invoices?${new URLSearchParams({ search: search.trim() })}`
      ),
    create: (payload) =>
      request<LogicxErpSchemeRecord>(basePath, { method: "POST", body: payload }),
    update: (id, payload) =>
      request<LogicxErpSchemeRecord>(recordPath(id), { method: "PUT", body: payload }),
    setStatus: (id, status) =>
      request<LogicxErpSchemeRecord>(`${recordPath(id)}/status`, {
        method: "POST",
        body: { status }
      }),
    remove: (id) => request<LogicxErpSchemeRecord>(recordPath(id), { method: "DELETE" })
  };
}

export function formatSchemeDate(value: string) {
  return formatWorkspaceDate(value);
}

export function formatSchemeAmount(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat("en-IN").format(value);
}
