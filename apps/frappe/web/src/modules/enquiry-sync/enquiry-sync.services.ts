import type {
  EnquiryImportJob,
  FrappeConnectionState,
  RemoteEnquiryPage
} from "./enquiry-sync.types";
import type { SyncQueuePage, SyncQueueStatus } from "./enquiry-sync.types";

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

async function request<T>(path: string, body?: unknown): Promise<T> {
  const baseUrl = (window as Window & { __CODEXSUN_RUNTIME_CONFIG__?: Record<string, string> })
    .__CODEXSUN_RUNTIME_CONFIG__?.VITE_PLATFORM_API_URL;
  if (!baseUrl) throw new Error("Missing Platform API URL.");
  const database = sessionStorage.getItem("codexsun_tenant_db_name");
  const tenantId = sessionStorage.getItem("codexsun_tenant_id");
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(database ? { "x-tenant-db": database } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const result = (await response.json()) as Envelope<T>;
  if (!response.ok || !result.success)
    throw new Error(result.success ? "Frappe request failed." : result.error.message);
  return result.data;
}

export const getConnectionState = () => request<FrappeConnectionState>("/frappe/connection");
export const getRemoteEnquiries = (page: number, pageSize: number) =>
  request<RemoteEnquiryPage>(
    `/frappe/enquiries/remote?${new URLSearchParams({ page: String(page), pageSize: String(pageSize) })}`
  );
export const getLatestImport = () => request<EnquiryImportJob | null>("/frappe/enquiries/import");
export const startImport = () =>
  request<{ jobId: number; status: string }>("/frappe/enquiries/import", {});
export const pullEnquiry = (remoteName: string) =>
  request<{ remoteName: string; enquiryId: number; status: "created" | "updated" | "linked" }>(
    "/frappe/enquiries/pull",
    { remoteName }
  );

export const getSyncQueue = (status: SyncQueueStatus, page: number, pageSize: number) =>
  request<SyncQueuePage>(
    `/frappe/enquiries/sync-queue?${new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) })}`
  );

export const retrySyncEvent = (eventId: number) =>
  request<{ id: number; status: "pending" }>(`/frappe/enquiries/sync-queue/${eventId}/retry`, {});
