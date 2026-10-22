export type TenantOption = { id: number; label: string; database?: string };
export type SourceOption = {
  id: number;
  label: string;
  host: string;
  port: number;
  database: string;
  user: string;
  tlsMode: "required" | "disabled";
  verifiedAt: string | null;
};
export type SourceInput = {
  label: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  tlsMode: "required" | "disabled";
};
export type SourceUpdate = Omit<SourceInput, "password"> & { password?: string };
export type MigrationRun = {
  id: string;
  sourceId: number;
  targetTenantId: number;
  table: string;
  sourceRows: number;
  copiedRows: number;
  status: string;
  error: string | null;
  actor: string;
  createdAt: string;
};
export type MigrationPreview = {
  table: string;
  sourceRows: number;
  targetRows: number;
  exactMatches: number | null;
  uniqueKeyConflicts: number | null;
  compatible: boolean;
  reason: string | null;
};
export type MigrationTableSample = {
  sourceTable: string;
  targetTable: string;
  sourceColumns: string[];
  targetColumns: string[];
  sourceRows: Array<Record<string, unknown>>;
  targetRows: Array<Record<string, unknown>>;
  source: { totalRows: number; page: number };
  target: { totalRows: number; page: number };
  pageSize: number;
  selectedMapping?: { sourceColumn: string; targetColumn: string };
};
export type TransferSelection = {
  sourceId: number;
  targetTenantId: number;
  table: string;
  targetTable?: string;
  columnMappings?: MigrationColumnMapping[];
};
export type MigrationAnalysis = {
  source: { label: string; database: string };
  target: { label: string; database: string };
  tables: MigrationTableAnalysis[];
  summary: {
    sourceTables: number;
    ready: number;
    alreadyPresent: number;
    blocked: number;
    mappingRequired: number;
    review: number;
    excluded: number;
    sourceRows: number;
    newRows: number;
    exactRows: number;
    conflictingRows: number;
  };
};
export type MigrationTableAnalysis = {
  table: string;
  sourceRows: number;
  targetRows: number;
  status: "ready" | "already-present" | "blocked" | "mapping-required" | "excluded" | "review";
  schemaCompatible: boolean;
  newRows: number | null;
  exactRows: number | null;
  conflictingRows: number | null;
  reason: string | null;
  dependencies: string[];
  sourceColumns: MigrationColumn[];
  targetColumns: MigrationColumn[];
};
export type MigrationColumn = {
  name: string;
  type: string;
  nullable: boolean;
  required: boolean;
  generated: boolean;
};
export type MigrationColumnMapping = {
  id?: number;
  sourceColumn: string;
  targetColumn: string;
  status?: string;
  by?: string;
};
export type SavedTableMapping = {
  id?: number;
  table: string;
  sourceTable?: string;
  targetTable?: string;
  sourceRows?: number;
  targetRows?: number;
  mappingStatus?: string;
  migrationStatus?: string;
  columnMappings: MigrationColumnMapping[];
};
export type MigrationJob = {
  id: string;
  sessionName: string;
  sourceId: number;
  sourceDatabase: string;
  sourceTenantId: number | null;
  targetTenantId: number;
  targetDatabase: string;
  sourceLabel: string;
  targetLabel: string;
  status: string;
  createdBy: string;
  createdAt: string;
  tableCount: number;
};
export type MigrationQueryPlan = {
  id: string;
  status: "generated" | "finalized" | "completed" | "stale";
  hash: string;
  generatedBy: string;
  generatedAt: string;
  finalizedBy: string | null;
  finalizedAt: string | null;
  canFinalize: boolean;
  sourceDatabase: string;
  targetDatabase: string;
  totalSourceRows: number;
  tables: Array<{
    sourceTable: string;
    targetTable: string;
    sourceRows: number;
    targetRows: number;
    sourceFingerprint: string;
    sourceSchemaFingerprint: string;
    targetSchemaFingerprint: string;
    columnMappings: MigrationColumnMapping[];
    excludedSourceFields: string[];
    selectSql: string;
    insertSqlTemplate: string;
    blockers: string[];
  }>;
  blockers: string[];
};
export type MigrationColumnOption = MigrationColumn & { defaultValue: unknown };
export type MigrationTableSchema = {
  sourceColumns: MigrationColumnOption[];
  targetColumns: MigrationColumnOption[];
};
