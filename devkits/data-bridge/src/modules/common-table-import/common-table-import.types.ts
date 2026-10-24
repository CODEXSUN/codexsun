export type DataBridgeSource = {
  id: number;
  label: string;
  host: string;
  port: number;
  database: string;
  user: string;
  tlsMode: "required" | "disabled";
  verifiedAt: string | null;
};

export type DataBridgeTenant = { id: number; label: string; database?: string };

export type CommonTableOption = {
  table: string;
  sourceRows: number | null;
  targetRows: number | null;
  sourceAvailable: boolean;
  targetAvailable: boolean;
  sourceColumns: string[];
  targetColumns: string[];
  missingTargetColumns: string[];
  missingRequiredColumns: string[];
  mismatchedColumns: string[];
  compatible: boolean;
  importStatus: "reviewed" | "imported" | "failed" | null;
};

export type CommonTableImportSummary = {
  id: string;
  sourceId: number;
  targetTenantId: number;
  table: string;
  sourceDatabase: string;
  targetDatabase: string;
  rowCount: number;
  importedRows: number;
  skippedRows: number;
  status: "reviewed" | "imported" | "failed";
  updatedAt: string;
};

export type CommonTablePreview = {
  sourceRows: number;
  targetRows: number;
  page: number;
  pageSize: number;
  columns: string[];
  missingRequiredColumns: string[];
  compatible: boolean;
  source: Array<Record<string, unknown>>;
  target: Array<Record<string, unknown>>;
  schemaHash: string;
};

export type CommonTableImportDetail = CommonTableImportSummary & {
  report: ImportReport | null;
  columns: string[];
  schemaHash: string;
  error: string | null;
  samples: Array<{ rowNumber: number; data: Record<string, unknown> }>;
};

export type ImportReport = {
  phase: "audit" | "complete" | "failed";
  at: string;
  actor: string;
  rows: Array<{
    rowNumber: number;
    status: "ready" | "existing" | "conflict" | "inserted" | "warning" | "rolled_back";
    message: string;
  }>;
};

export type CommonBulkReport = {
  scope?: "common" | "masters";
  id: string;
  sourceId: number;
  targetTenantId: number;
  sourceDatabase: string;
  targetDatabase: string;
  actor: string;
  at: string;
  updatedAt: string;
  status: "queued" | "running" | "success" | "warning" | "failed";
  message: string;
  tables: Array<{
    table: string;
    status: "pending" | "running" | "success" | "warning";
    sourceRows: number;
    existing: number;
    inserted: number;
    message: string;
    importId: string | null;
    rows?: Array<{
      rowId: number;
      status: "imported" | "existing" | "warning" | "pending";
      message: string;
      source: Record<string, unknown>;
      target: Record<string, unknown> | null;
      collection?: Record<string, unknown>;
      prepared?: Record<string, unknown>;
    }>;
    attention: Array<{ rowId: number | null; message: string }>;
  }>;
};

export type ConflictResolution = {
  id: string;
  table: string;
  sourceId: number;
  targetId: number;
  targetUuid: string | null;
  status: "prepared" | "committed";
  source: Record<string, unknown>;
  collection: Record<string, unknown>;
  references: Array<{
    field: string;
    parentTable: string;
    sourceId: number;
    targetId: number;
    sourceValue: unknown;
    targetValue: unknown;
    sourceKey: Record<string, unknown>;
    targetKey: Record<string, unknown>;
  }>;
  prepared: Record<string, unknown>;
  before: Record<string, unknown>;
  changes: string[];
  fingerprint: string;
  actor: string;
  preparedAt: string;
  committedAt: string | null;
};
