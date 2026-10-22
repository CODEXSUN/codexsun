import type { FastifyRequest } from "fastify";
import type { Kysely } from "kysely";

export type MigrationTenant = {
  id: number;
  label: string;
  database: string;
  host: string;
  port: number;
  user: string;
  password: string;
  tlsMode?: "required" | "disabled";
};

export type DataMigrationHost = {
  authorize(request: FastifyRequest): Promise<string> | string;
  listTenants(): Promise<Array<{ id: number; label: string; database?: string }>>;
  resolveTenant(id: number): Promise<MigrationTenant>;
  database: Kysely<unknown>;
  secretKey: string;
  masterDatabase: { host: string; port: number; database: string };
  currentDatabase: { host: string; port: number; user: string; password: string };
};

export type MigrationSourceInput = Omit<MigrationTenant, "id"> & {
  tlsMode: "required" | "disabled";
};

export type MigrationSourceUpdate = Omit<MigrationSourceInput, "password"> & {
  password?: string | undefined;
};

export type TableColumn = {
  name: string;
  type: string;
  nullable: string;
  extra: string;
  defaultValue: unknown;
  required: boolean;
};

export type MigrationColumnMapping = { sourceColumn: string; targetColumn: string };

export type TablePreview = {
  table: string;
  sourceRows: number;
  targetRows: number;
  exactMatches: number | null;
  uniqueKeyConflicts: number | null;
  compatible: boolean;
  reason: string | null;
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

export type TableDataSample = {
  sourceTable: string;
  targetTable: string;
  sourceRows: Array<Record<string, unknown>>;
  targetRows: Array<Record<string, unknown>>;
  limit: number;
};
