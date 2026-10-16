import type { ZetroConversation, ZetroConversationDetail } from "./chat.types";
import type { ZetroTextAttachment } from "./chat.attachment";

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

async function zetroRequest<T>(
  path: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
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
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(database ? { "x-tenant-db": database } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const result = (await response.json()) as Envelope<T>;
  if (!response.ok || !result.success) {
    throw new Error(result.success ? "Zetro request failed." : result.error.message);
  }
  return result.data;
}

export const listZetroConversations = () =>
  zetroRequest<ZetroConversation[]>("/zetro/conversations");
export const getZetroConversation = (id: number) =>
  zetroRequest<ZetroConversationDetail>(`/zetro/conversations/${id}`);
export const sendZetroMessage = (
  conversationId: number | null,
  prompt: string,
  attachment?: ZetroTextAttachment,
  onProgress?: (event: { event: "status" | "token"; content: string }) => void
) =>
  onProgress
    ? streamZetroMessage(conversationId, prompt, attachment, onProgress)
    : zetroRequest<ZetroConversationDetail>("/zetro/messages", "POST", {
        conversationId,
        prompt,
        ...(attachment ? { attachment } : {})
      });

async function streamZetroMessage(
  conversationId: number | null,
  prompt: string,
  attachment: ZetroTextAttachment | undefined,
  onProgress: (event: { event: "status" | "token"; content: string }) => void
): Promise<ZetroConversationDetail> {
  const baseUrl = (window as Window & { __CODEXSUN_RUNTIME_CONFIG__?: Record<string, string> })
    .__CODEXSUN_RUNTIME_CONFIG__?.VITE_PLATFORM_API_URL;
  if (!baseUrl) throw new Error("Missing Platform API URL.");
  const database = sessionStorage.getItem("codexsun_tenant_db_name");
  const tenantId = sessionStorage.getItem("codexsun_tenant_id");
  const response = await fetch(`${baseUrl}/zetro/messages/stream`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/x-ndjson",
      "Content-Type": "application/json",
      ...(database ? { "x-tenant-db": database } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {})
    },
    body: JSON.stringify({ conversationId, prompt, ...(attachment ? { attachment } : {}) })
  });
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => null)) as Envelope<unknown> | null;
    throw new Error(
      payload && !payload.success ? payload.error.message : "Zetro could not start the reply."
    );
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let detail: ZetroConversationDetail | null = null;
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let boundary = buffer.indexOf("\n");
    while (boundary >= 0) {
      const line = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);
      if (line) {
        const envelope = JSON.parse(line) as Envelope<
          | { event: "status" | "token"; content: string }
          | { event: "complete"; detail: ZetroConversationDetail }
          | { event: "error"; message: string }
        >;
        if (!envelope.success) throw new Error(envelope.error.message);
        if (envelope.data.event === "error") throw new Error(envelope.data.message);
        if (envelope.data.event === "complete") detail = envelope.data.detail;
        else onProgress(envelope.data);
      }
      boundary = buffer.indexOf("\n");
    }
    if (done) break;
  }
  if (!detail) throw new Error("Zetro did not complete the reply.");
  return detail;
}
export const deleteZetroConversation = (id: number) =>
  zetroRequest<{ deleted: true }>(`/zetro/conversations/${id}`, "DELETE");
