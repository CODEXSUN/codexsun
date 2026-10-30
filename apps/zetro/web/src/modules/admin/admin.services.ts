import type {
  ZetroGrant,
  ZetroGrantChange,
  ZetroGrantEvent,
  ZetroApproval,
  ZetroInteractionLog,
  ZetroPatternDraft,
  ZetroQueryPattern,
  ZetroRole,
  ZetroTenantOption,
  ZetroReviewConversation,
  ZetroReviewDetail
} from "./admin.types";

type Envelope<T> = { success: true; data: T } | { success: false; error: { message: string } };

async function adminRequest<T>(
  path: string,
  body?:
    | ZetroPatternDraft
    | ZetroGrantChange
    | { note: string }
    | { status: "approved" | "rejected"; note: string },
  method?: "POST" | "PUT"
): Promise<T> {
  const baseUrl = (window as Window & { __CODEXSUN_RUNTIME_CONFIG__?: Record<string, string> })
    .__CODEXSUN_RUNTIME_CONFIG__?.VITE_PLATFORM_API_URL;
  if (!baseUrl) throw new Error("Missing Platform API URL.");
  const response = await fetch(`${baseUrl}${path}`, {
    method: method ?? (body ? "POST" : "GET"),
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const result = (await response.json()) as Envelope<T>;
  if (!response.ok || !result.success) {
    throw new Error(result.success ? "Zetro review request failed." : result.error.message);
  }
  return result.data;
}

export const listZetroTenants = () => adminRequest<ZetroTenantOption[]>("/admin/tenants");
export const listZetroPatterns = (tenantId: string) =>
  adminRequest<ZetroQueryPattern[]>(`/zetro/admin/tenants/${tenantId}/patterns`);
export const listZetroInteractions = (tenantId: string) =>
  adminRequest<ZetroInteractionLog[]>(`/zetro/admin/tenants/${tenantId}/interactions`);
export const createZetroPatternDraft = (tenantId: string, draft: ZetroPatternDraft) =>
  adminRequest<{ uuid: string; status: "draft" }>(
    `/zetro/admin/tenants/${tenantId}/patterns`,
    draft
  );
export const listZetroGrants = (tenantId: string) =>
  adminRequest<ZetroGrant[]>(`/zetro/admin/tenants/${tenantId}/grants`);
export const listZetroRoles = (tenantId: string) =>
  adminRequest<ZetroRole[]>(`/zetro/admin/tenants/${tenantId}/roles`);
export const saveZetroGrant = (tenantId: string, change: ZetroGrantChange) =>
  adminRequest<{ saved: true }>(`/zetro/admin/tenants/${tenantId}/grants`, change, "PUT");
export const listZetroGrantEvents = (tenantId: string) =>
  adminRequest<ZetroGrantEvent[]>(`/zetro/admin/tenants/${tenantId}/grants/events`);
export const listZetroReviewConversations = (tenantId: string) =>
  adminRequest<ZetroReviewConversation[]>(`/zetro/admin/tenants/${tenantId}/conversations`);
export const getZetroReviewConversation = (tenantId: string, id: number) =>
  adminRequest<ZetroReviewDetail>(`/zetro/admin/tenants/${tenantId}/conversations/${id}`);
export const addZetroReviewNote = (tenantId: string, id: number, note: string) =>
  adminRequest<{ saved: true }>(`/zetro/admin/tenants/${tenantId}/conversations/${id}/notes`, {
    note
  });
export const listZetroApprovals = (tenantId: string) =>
  adminRequest<ZetroApproval[]>(`/zetro/admin/tenants/${tenantId}/approvals`);
export const decideZetroApproval = (
  tenantId: string,
  id: number,
  status: "approved" | "rejected",
  note: string
) =>
  adminRequest<{ saved: true }>(`/zetro/admin/tenants/${tenantId}/approvals/${id}/decision`, {
    status,
    note
  });
