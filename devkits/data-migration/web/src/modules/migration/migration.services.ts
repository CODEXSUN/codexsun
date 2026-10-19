import type {
  TenantOption,
  SourceOption,
  SourceInput,
  SourceUpdate,
  MigrationRun,
  MigrationPreview,
  TransferSelection
} from "./migration.types.js";
export type {
  TenantOption,
  SourceOption,
  SourceInput,
  SourceUpdate,
  MigrationRun,
  MigrationPreview,
  TransferSelection
} from "./migration.types.js";

type Envelope<T> = { success: true; data: T } | { success: false; error: { message: string } };

async function request<T>(path: string, body?: unknown, method?: "POST" | "PUT"): Promise<T> {
  const slot = sessionStorage.getItem("codexsun.auth.slot");
  const response = await fetch(`/api/data-migration${path}`, {
    method: body === undefined ? "GET" : (method ?? "POST"),
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(slot ? { "x-codexsun-session-slot": slot } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!response.ok || !envelope.success) {
    throw new Error(
      envelope.success ? `Request failed (${response.status}).` : envelope.error.message
    );
  }
  return envelope.data;
}

export const listTenants = () => request<TenantOption[]>("/tenants");
export const listSources = () => request<SourceOption[]>("/sources");
export const getCurrentConnection = () =>
  request<{ host: string; port: number; user: string }>("/current-connection");
export const saveCurrentConnection = () => request<{ id: number }>("/sources/current", {});
export const addSource = (input: SourceInput) => request<{ id: number }>("/sources", input);
export const updateSource = (id: number, input: SourceUpdate) =>
  request<{ id: number }>(`/sources/${id}`, input, "PUT");
export const verifySource = (id: number) =>
  request<{ verified: boolean }>(`/sources/${id}/verify`, {});
export const listDatabases = (id: number) => request<string[]>(`/sources/${id}/databases`);
export const deactivateSource = (id: number) => request<unknown>(`/sources/${id}/deactivate`, {});
export const removeSource = (id: number) => request<unknown>(`/sources/${id}/remove`, {});
export const listTables = (sourceId: number) => request<string[]>(`/sources/${sourceId}/tables`);
export const listRuns = () => request<MigrationRun[]>("/runs");
export const previewTransfer = (selection: TransferSelection) =>
  request<MigrationPreview>("/preview", selection);
export const executeTransfer = (selection: TransferSelection) =>
  request<{ id: string; copiedRows: number }>("/runs", selection);
