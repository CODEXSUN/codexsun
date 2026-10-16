import type { FrappeConnection, FrappeOverview } from "./overview.types";
import { frappeRequest as requestImport } from "../../frappe-request";

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

async function frappeRequest<T>(path: string, method: "GET" | "POST" = "GET"): Promise<T> {
  const baseUrl = (window as Window & { __CODEXSUN_RUNTIME_CONFIG__?: Record<string, string> })
    .__CODEXSUN_RUNTIME_CONFIG__?.VITE_PLATFORM_API_URL;
  if (!baseUrl) throw new Error("Missing Platform API URL.");
  const database = sessionStorage.getItem("codexsun_tenant_db_name");
  const tenantId = sessionStorage.getItem("codexsun_tenant_id");
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(database ? { "x-tenant-db": database } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {})
    }
  });
  const result = (await response.json()) as Envelope<T>;
  if (!response.ok || !result.success) {
    throw new Error(result.success ? "Frappe request failed." : result.error.message);
  }
  return result.data;
}

export const getFrappeConnection = () => frappeRequest<FrappeConnection>("/frappe/connection");
export const verifyFrappeConnection = () =>
  frappeRequest<{ connected: boolean; user: string }>("/frappe/connection/verify", "POST");
export const completeFrappeImport = () =>
  requestImport<{ completedAt: string; completedBy: string }>("POST", "/frappe/import-state/complete", { confirmation: "STOP_FRAPPE" });
export const getFrappeOverview = (page: number, pageSize: number, search: string) =>
  frappeRequest<FrappeOverview>(
    `/frappe/overview?${new URLSearchParams({ page: String(page), pageSize: String(pageSize), search })}`
  );
