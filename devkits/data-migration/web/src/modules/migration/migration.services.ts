import type {
  TenantOption,
  SourceOption,
  SourceInput,
  SourceUpdate,
  MigrationRun,
  MigrationPreview,
  MigrationTableSample,
  TransferSelection,
  MigrationColumnMapping,
  MigrationAnalysis,
  MigrationTableSchema,
  MigrationJob,
  MigrationQueryPlan,
  MigrationQueryBatch,
  MigrationAuditQueueSummary,
  MigrationAuditQueueItem
} from "./migration.types.js";
import type { SavedTableMapping } from "./migration.types.js";
export type {
  TenantOption,
  SourceOption,
  SourceInput,
  SourceUpdate,
  MigrationRun,
  MigrationPreview,
  MigrationTableSample,
  TransferSelection,
  MigrationAnalysis,
  MigrationColumnMapping,
  MigrationTableSchema,
  SavedTableMapping,
  MigrationJob,
  MigrationQueryPlan,
  MigrationQueryBatch,
  MigrationAuditQueueSummary,
  MigrationAuditQueueItem
} from "./migration.types.js";

type Envelope<T> =
  | { success: true; data: T; meta?: { requestId?: string } }
  | { success: false; error: { code?: string; message: string }; meta?: { requestId?: string } };

async function request<T>(
  path: string,
  body?: unknown,
  method?: "POST" | "PUT" | "PATCH" | "DELETE"
): Promise<T> {
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
  const envelope = await readResponse<T>(response);
  if (!response.ok || !envelope.success) {
    const serverMessage = envelope.success
      ? `Request failed (${response.status}).`
      : envelope.error.message;
    const requestId = envelope.meta?.requestId;
    throw new Error(requestId ? `${serverMessage} (Request ID: ${requestId})` : serverMessage);
  }
  return envelope.data;
}

async function readResponse<T>(response: Response): Promise<Envelope<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const message =
      response.status === 502 || response.status === 503 || response.status === 504
        ? "The Data Migration API is unavailable. Check the Platform API and web proxy."
        : "The Data Migration API returned a non-JSON response. Check that /api/data-migration is routed to the Platform API instead of the web app.";
    throw new Error(`${message} (HTTP ${response.status})`);
  }
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new Error(`The Data Migration API returned invalid JSON (HTTP ${response.status}).`);
  }
  if (
    !value ||
    typeof value !== "object" ||
    !("success" in value) ||
    (value.success !== true && value.success !== false) ||
    (value.success === true && !("data" in value)) ||
    (value.success === false &&
      (!("error" in value) ||
        !value.error ||
        typeof value.error !== "object" ||
        !("message" in value.error) ||
        typeof value.error.message !== "string"))
  ) {
    throw new Error(
      `The Data Migration API returned an invalid response (HTTP ${response.status}).`
    );
  }
  return value as Envelope<T>;
}

export const listTenants = () => request<TenantOption[]>("/tenants");
export const listSources = () => request<SourceOption[]>("/sources");
export const getCurrentConnection = () =>
  request<{ host: string; port: number; user: string }>("/current-connection");
export const saveCurrentConnection = () => request<{ id: number }>("/sources/current", {});
export const addSource = (input: SourceInput) => request<{ id: number }>("/sources", input);
export const copySource = (id: number, input: SourceUpdate) =>
  request<{ id: number }>(`/sources/${id}/copy`, input);
export const updateSource = (id: number, input: SourceUpdate) =>
  request<{ id: number }>(`/sources/${id}`, input, "PUT");
export const verifySource = (id: number) =>
  request<{ verified: boolean }>(`/sources/${id}/verify`, {});
export const listDatabases = (id: number) => request<string[]>(`/sources/${id}/databases`);
export const deactivateSource = (id: number) => request<unknown>(`/sources/${id}/deactivate`, {});
export const removeSource = (id: number) => request<unknown>(`/sources/${id}/remove`, {});
export const listTables = (sourceId: number) => request<string[]>(`/sources/${sourceId}/tables`);
export const listRuns = () => request<MigrationRun[]>("/runs");
export const listJobs = () => request<MigrationJob[]>("/jobs");
export const createJob = (input: {
  sessionName: string;
  sourceId: number;
  sourceTenantId: number | null;
  targetTenantId: number;
}) => request<{ id: string }>("/jobs", input);
export const renameJob = (id: string, sessionName: string) =>
  request<{ id: string; sessionName: string }>(`/jobs/${id}`, { sessionName }, "PATCH");
export const deleteJob = (id: string) => request<{ deleted: true }>(`/jobs/${id}`, {}, "DELETE");
export const listTenantTables = (tenantId: number) =>
  request<string[]>(`/tenants/${tenantId}/tables`);
export const getTenantDatabase = (tenantId: number) =>
  request<{ database: string }>(`/tenants/${tenantId}/database`);
export const readJobTables = (jobId: string) =>
  request<SavedTableMapping[]>(`/jobs/${jobId}/tables`);
export const readJobQueryPlan = (jobId: string) =>
  request<MigrationQueryPlan | null>(`/jobs/${jobId}/query-plan`);
export const readQueryBatch = (jobId: string) =>
  request<MigrationQueryBatch | null>(`/jobs/${jobId}/query-batch`);
export const generateJobQueryPlan = (jobId: string) =>
  request<MigrationQueryPlan>(`/jobs/${jobId}/query-plan/generate`, {});
export const handoffJobToAuditQueue = (jobId: string, rowIds: number[]) =>
  request<MigrationAuditQueueItem>(`/jobs/${jobId}/audit-handoff`, { rowIds });
export const listMigrationAuditQueue = () => request<MigrationAuditQueueSummary[]>("/audit-queue");
export const readMigrationAuditItem = (id: string) =>
  request<MigrationAuditQueueItem>(`/audit-queue/${id}`);
export const markMigrationAuditReviewed = (id: string) =>
  request<MigrationAuditQueueItem>(`/audit-queue/${id}/review`, {});
export const runReviewedMigration = (id: string) =>
  request<{ completed: Array<{ table: string; copiedRows: number }>; copiedRows: number }>(
    `/audit-queue/${id}/run`,
    {}
  );
export const deleteMigrationAuditItem = (id: string) =>
  request<{ deleted: true }>(`/audit-queue/${id}`, {}, "DELETE");
export const finalizeJobQueryPlan = (jobId: string) =>
  request<MigrationQueryPlan | null>(`/jobs/${jobId}/query-plan/finalize`, {});
export const saveQueryBatch = (
  jobId: string,
  input: {
    rows: Array<{
      sourceTable: string;
      targetTable: string;
      rowNumber: number;
      rowData: Record<string, unknown>;
    }>;
    fieldValues: Record<string, { mode: "default" | "custom" | "foreign"; value: unknown }>;
  }
) =>
  request<{ id: string; savedRows: number; status: "draft" }>(`/jobs/${jobId}/query-batch`, input);
export const deleteQueryBatch = (jobId: string) =>
  request<{ deletedRows: number }>(`/jobs/${jobId}/query-batch`, {}, "DELETE");
export const saveJobTablePair = (
  jobId: string,
  input: { sourceTable: string; targetTable: string; columnMappings: MigrationColumnMapping[] }
) =>
  request<{ saved: boolean; jobId: string; sourceTable: string; targetTable: string }>(
    `/jobs/${jobId}/tables`,
    {
      sourceTable: input.sourceTable,
      targetTable: input.targetTable,
      columnMappings: input.columnMappings.map(({ sourceColumn, targetColumn }) => ({
        sourceColumn,
        targetColumn
      }))
    },
    "PUT"
  );
export const deleteJobTablePair = (jobId: string, sourceTable: string) =>
  request<{ deleted: true }>(
    `/jobs/${jobId}/tables/${encodeURIComponent(sourceTable)}`,
    {},
    "DELETE"
  );
export const previewTransfer = (selection: TransferSelection) =>
  request<MigrationPreview>("/preview", selection);
export const sampleTableData = (
  selection: TransferSelection & {
    sourcePage: number;
    targetPage: number;
    sourceColumn?: string;
    targetColumn?: string;
  }
) => request<MigrationTableSample>("/sample", selection);
export const analyzeMigration = (selection: Omit<TransferSelection, "table">) =>
  request<MigrationAnalysis>("/analysis", selection);
export const getTableSchema = (selection: TransferSelection) =>
  request<MigrationTableSchema>("/schema", selection);
