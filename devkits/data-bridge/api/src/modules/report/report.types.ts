import type { CommonTableName } from "../import-review/index.js";

export type BulkTableReport = {
  table: CommonTableName;
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
};

export type BulkImportReport = {
  resolutions?: import("./report.resolution.types.js").ConflictResolution[];
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
  tables: BulkTableReport[];
};
