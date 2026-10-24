export type VerifiedBridgeConnection = {
  sourceId: number;
  targetTenantId: number;
  sourceDatabase: string;
  targetDatabase: string;
  verifiedAt: string;
};
export type SourceOption = { id: number; label: string; database: string };
export type TenantOption = { id: number; label: string; database?: string };
