export type BridgeReportSummary = {
  id: string;
  type: "transfer" | "review" | "bulk" | "business";
  group: string;
  sourceDatabase: string;
  targetDatabase: string;
  table: string;
  rows: number;
  status: string;
  updatedAt: string;
  stage: number;
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
