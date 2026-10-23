import type { FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import type { DataMigrationBridgeAccess } from "@codexsun/data-migration-api";
import type { MigrationTenant } from "@codexsun/data-migration-api";

export const commonTableNames = [
  "core_ledger_groups",
  "core_ledgers",
  "core_address_types",
  "core_bank_names",
  "core_contact_groups",
  "core_contact_types",
  "core_cities",
  "core_countries",
  "core_districts",
  "core_pincodes",
  "core_states",
  "core_currencies",
  "core_months",
  "core_payment_terms",
  "core_priorities",
  "core_sales_types",
  "core_brands",
  "core_colours",
  "core_hsn_codes",
  "core_product_categories",
  "core_product_groups",
  "core_product_types",
  "core_sizes",
  "core_styles",
  "core_taxes",
  "core_units",
  "core_destinations",
  "core_stock_rejection_types",
  "core_transports",
  "core_warehouses",
  "core_work_order_types"
] as const;

export type CommonTableName = (typeof commonTableNames)[number];

export type ImportRowReport = {
  rowNumber: number;
  status: "ready" | "existing" | "conflict" | "inserted" | "warning" | "rolled_back";
  message: string;
};
export type ImportReport = {
  phase: "audit" | "complete" | "failed";
  at: string;
  actor: string;
  rows: ImportRowReport[];
};

export type CommonTableImportHost = {
  database: Kysely<unknown>;
  authorize(request: FastifyRequest): Promise<string> | string;
  listTenants(): Promise<Array<{ id: number; label: string; database?: string }>>;
  resolveTenant(id: number): Promise<MigrationTenant>;
  dataMigration: DataMigrationBridgeAccess;
  enqueueBulk?: (input: {
    runId: string;
    targetTenantId: number;
    actor: string;
    correlationId: string;
  }) => Promise<void>;
};

export type CommonTableImportSummary = {
  id: string;
  sourceId: number;
  targetTenantId: number;
  table: CommonTableName;
  sourceDatabase: string;
  targetDatabase: string;
  rowCount: number;
  importedRows: number;
  skippedRows: number;
  status: "reviewed" | "imported" | "failed";
  updatedAt: string;
};

export type CommonTableOption = {
  table: CommonTableName;
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
  importStatus: CommonTableImportSummary["status"] | null;
};
