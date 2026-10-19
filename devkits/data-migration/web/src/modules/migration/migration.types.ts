export type TenantOption = { id: number; label: string };
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
  compatible: boolean;
  reason: string | null;
};
export type TransferSelection = {
  sourceId: number;
  targetTenantId: number;
  table: string;
};
