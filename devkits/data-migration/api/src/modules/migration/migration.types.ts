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
  compatible: boolean;
  reason: string | null;
};
