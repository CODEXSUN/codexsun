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

export type CommonTableSelection = {
  sourceId: number;
  targetTenantId: number;
  table: string;
  importId?: string;
};
