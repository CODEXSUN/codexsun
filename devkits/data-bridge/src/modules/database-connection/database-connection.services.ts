import { request } from "../transport/index.js";
import type {
  SourceOption,
  TenantOption,
  VerifiedBridgeConnection
} from "./database-connection.types.js";
export const listBridgeSources = () => request<SourceOption[]>("/sources");
export const listBridgeTenants = () => request<TenantOption[]>("/tenants");
export const verifyBridgeConnection = (sourceId: number, targetTenantId: number) =>
  request<VerifiedBridgeConnection>("/connections/verify", { sourceId, targetTenantId });
