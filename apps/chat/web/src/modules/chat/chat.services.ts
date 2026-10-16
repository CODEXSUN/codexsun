import type {
  ChatChannel,
  ChatChannelDetail,
  ChatChannelSavePayload,
  ChatMember,
  ChatMemberSavePayload,
  ChatMessage,
  ChatMessageSavePayload,
  ChatUserOption
} from "./chat.types";

const API_BASE_URL = requiredRuntimeValue("VITE_PLATFORM_API_URL");

export function listChatUsers(search = "") {
  const suffix = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return chatRequest<ChatUserOption[]>(`/chat/users${suffix}`);
}

export function listChannels(search = "") {
  const suffix = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return chatRequest<ChatChannel[]>(`/chat/channels${suffix}`);
}

export function getChannel(id: string) {
  return chatRequest<ChatChannelDetail>(`/chat/channels/${encodeURIComponent(id)}`);
}

export function createChannel(payload: ChatChannelSavePayload) {
  return chatRequest<ChatChannel>("/chat/channels", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function renameChannel(id: string, name: string) {
  return chatRequest<ChatChannel>(`/chat/channels/${encodeURIComponent(id)}`, {
    body: JSON.stringify({ name }),
    method: "PUT"
  });
}

export function suspendChannel(id: string) {
  return chatRequest<ChatChannel>(`/chat/channels/${encodeURIComponent(id)}/suspend`, {
    method: "POST"
  });
}

export function restoreChannel(id: string) {
  return chatRequest<ChatChannel>(`/chat/channels/${encodeURIComponent(id)}/restore`, {
    method: "POST"
  });
}

export function forceDeleteChannel(id: string) {
  return chatRequest<{ uuid: string }>(`/chat/channels/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function markChannelRead(id: string) {
  return chatRequest<{ uuid: string }>(`/chat/channels/${encodeURIComponent(id)}/read`, {
    method: "POST"
  });
}

export function listMembers(id: string) {
  return chatRequest<ChatMember[]>(`/chat/channels/${encodeURIComponent(id)}/members`);
}

export function addMember(id: string, payload: ChatMemberSavePayload) {
  return chatRequest<ChatMember>(`/chat/channels/${encodeURIComponent(id)}/members`, {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function removeMember(id: string, memberUuid: string) {
  return chatRequest<{ uuid: string }>(
    `/chat/channels/${encodeURIComponent(id)}/members/${encodeURIComponent(memberUuid)}`,
    { method: "DELETE" }
  );
}

export function listMessages(channelUuid: string) {
  return chatRequest<ChatMessage[]>(
    `/chat/messages?channelUuid=${encodeURIComponent(channelUuid)}`
  );
}

export function createMessage(payload: ChatMessageSavePayload) {
  return chatRequest<ChatMessage>("/chat/messages", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function updateMessage(id: string, body: string) {
  return chatRequest<ChatMessage>(`/chat/messages/${encodeURIComponent(id)}`, {
    body: JSON.stringify({ body }),
    method: "PUT"
  });
}

export function suspendMessage(id: string) {
  return chatRequest<ChatMessage>(`/chat/messages/${encodeURIComponent(id)}/suspend`, {
    method: "POST"
  });
}

export function restoreMessage(id: string) {
  return chatRequest<ChatMessage>(`/chat/messages/${encodeURIComponent(id)}/restore`, {
    method: "POST"
  });
}

export function forceDeleteMessage(id: string) {
  return chatRequest<{ uuid: string }>(`/chat/messages/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function toggleReaction(id: string, emoji: string) {
  return chatRequest<ChatMessage>(`/chat/messages/${encodeURIComponent(id)}/reactions`, {
    body: JSON.stringify({ emoji }),
    method: "POST"
  });
}

export async function chatRequest<T>(path: string, init: RequestInit = {}) {
  const tenantId = sessionStorage.getItem("codexsun_tenant_id");
  const tenantDatabase = sessionStorage.getItem("codexsun_tenant_db_name");
  const companyId = sessionStorage.getItem("codexsun.tenant.company-id");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...(tenantDatabase ? { "x-tenant-db": tenantDatabase } : {}),
      ...(companyId ? { "x-company-id": companyId } : {}),
      ...(init.headers ?? {})
    }
  });
  const body = (await response.json()) as { data?: T; error?: { message?: string } };
  if (!response.ok)
    throw new Error(body.error?.message ?? `Chat request failed: ${response.status}`);
  return body.data as T;
}

function requiredRuntimeValue(name: string) {
  const runtime = (
    window as Window & {
      __CODEXSUN_RUNTIME_CONFIG__?: Readonly<Record<string, string>>;
    }
  ).__CODEXSUN_RUNTIME_CONFIG__;
  const value = runtime?.[name]?.trim();
  if (!value) throw new Error(`Missing required runtime configuration: ${name}`);
  return value;
}

export type ChatRealtimeStatus = "connecting" | "open" | "closed";

export type ChatRealtimeHandlers = {
  onError?: (message: string) => void;
  onMessageChanged?: (message: ChatMessage, channelUuid: string) => void;
  onMessageCreated?: (message: ChatMessage, channelUuid: string) => void;
  onMessageDeleted?: (channelUuid: string, uuid: string) => void;
  onPresence?: (channelUuid: string, online: string[]) => void;
  onStatusChange?: (status: ChatRealtimeStatus) => void;
  onSyncCompleted?: (channelUuid: string, messages: ChatMessage[]) => void;
  onTyping?: (channelUuid: string, userEmail: string, typing: boolean) => void;
};

function chatRealtimeUrl(): string {
  const apiBaseUrl = requiredRuntimeValue("VITE_PLATFORM_API_URL").replace(/\/$/u, "");
  const companyId = sessionStorage.getItem("codexsun.tenant.company-id") ?? "";
  const sessionSlot = sessionStorage.getItem("codexsun.auth.slot") ?? "";
  const tenantId = sessionStorage.getItem("codexsun_tenant_id") ?? "";
  const tenantDatabase = sessionStorage.getItem("codexsun_tenant_db_name") ?? "";

  const params = new URLSearchParams();
  if (companyId) params.set("companyId", companyId);
  if (sessionSlot) params.set("sessionSlot", sessionSlot);
  if (tenantId) params.set("tenantId", tenantId);
  if (tenantDatabase) params.set("tenantDatabase", tenantDatabase);

  const query = params.toString() ? `?${params.toString()}` : "";
  const suffix = `/chat/realtime${query}`;
  if (/^https?:\/\//u.test(apiBaseUrl)) {
    const url = new URL(apiBaseUrl);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const basePath = url.pathname.replace(/\/$/u, "");
    return `${protocol}//${url.host}${basePath}${suffix}`;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${apiBaseUrl}${suffix}`;
}

let realtimeEventId = 0;

function realtimeFrame(eventType: string, payload: Record<string, unknown>): string {
  realtimeEventId += 1;
  return JSON.stringify({ eventId: String(realtimeEventId), eventType, payload });
}

/**
 * Managed WebSocket client for team chat realtime. The socket authenticates
 * during the HTTP upgrade through the platform session cookie; every frame
 * after that only carries already-authorized chat operations.
 */
export class ChatRealtimeClient {
  private readonly handlers: ChatRealtimeHandlers;
  private socket: WebSocket | null = null;
  private readonly subscribed = new Set<string>();
  private open = false;
  private closedByClient = false;
  private reconnectTimer: number | null = null;
  private reconnectDelay = 2_000;

  get isOpen(): boolean {
    return this.open;
  }

  constructor(handlers: ChatRealtimeHandlers = {}) {
    this.handlers = handlers;
    queueMicrotask(() => {
      if (!this.closedByClient) this.connect();
    });
  }

  private connect() {
    if (this.closedByClient) return;
    this.handlers.onStatusChange?.("connecting");
    let socket: WebSocket;
    try {
      socket = new WebSocket(chatRealtimeUrl());
    } catch {
      this.open = false;
      this.handlers.onStatusChange?.("closed");
      this.handlers.onError?.("The chat realtime connection could not be established.");
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;
    socket.onopen = () => {
      this.open = true;
      this.reconnectDelay = 2_000;
      this.handlers.onStatusChange?.("open");
      for (const channelUuid of this.subscribed) {
        this.send("chat.subscribe", { channelUuid });
      }
    };
    socket.onclose = () => {
      this.open = false;
      this.handlers.onStatusChange?.("closed");
      if (!this.closedByClient) this.scheduleReconnect();
    };
    socket.onerror = () => {
      this.open = false;
      this.handlers.onError?.("The chat realtime connection could not be established.");
    };
    socket.onmessage = (event) => this.receive(String(event.data));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
  }

  private receive(raw: string) {
    let envelope: { eventType: string; payload: Record<string, unknown> };
    try {
      envelope = JSON.parse(raw) as typeof envelope;
    } catch {
      return;
    }
    const payload = envelope.payload ?? {};
    switch (envelope.eventType) {
      case "message.created":
        this.handlers.onMessageCreated?.(
          payload.message as ChatMessage,
          String(payload.channelUuid ?? "")
        );
        break;
      case "message.updated":
        this.handlers.onMessageChanged?.(
          payload.message as ChatMessage,
          String(payload.channelUuid ?? "")
        );
        break;
      case "message.deleted":
        this.handlers.onMessageDeleted?.(
          String(payload.channelUuid ?? ""),
          String((payload as { uuid?: string }).uuid ?? "")
        );
        break;
      case "typing.started":
        this.handlers.onTyping?.(
          String(payload.channelUuid ?? ""),
          String(payload.userEmail ?? ""),
          true
        );
        break;
      case "typing.stopped":
        this.handlers.onTyping?.(
          String(payload.channelUuid ?? ""),
          String(payload.userEmail ?? ""),
          false
        );
        break;
      case "presence.updated":
        this.handlers.onPresence?.(
          String(payload.channelUuid ?? ""),
          Array.isArray(payload.online) ? payload.online.map(String) : []
        );
        break;
      case "sync.completed":
        this.handlers.onSyncCompleted?.(
          String(payload.channelUuid ?? ""),
          Array.isArray(payload.messages) ? (payload.messages as ChatMessage[]) : []
        );
        break;
      case "error":
        this.handlers.onError?.(
          String(
            (payload as { message?: string }).message ??
              (payload as { code?: string }).code ??
              "Chat realtime error."
          )
        );
        break;
      default:
        break;
    }
  }

  private send(eventType: string, payload: Record<string, unknown>) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(realtimeFrame(eventType, payload));
  }

  ping() {
    this.send("chat.ping", {});
  }

  subscribe(channelUuid: string) {
    this.subscribed.add(channelUuid);
    this.send("chat.subscribe", { channelUuid });
  }

  unsubscribe(channelUuid: string) {
    this.subscribed.delete(channelUuid);
    this.send("chat.unsubscribe", { channelUuid });
  }

  sendTyping(channelUuid: string, typing: boolean) {
    this.send("chat.typing", { channelUuid, typing });
  }

  markRead(channelUuid: string) {
    this.send("chat.read", { channelUuid });
  }

  requestSync(channelUuid: string, after: string) {
    this.send("chat.sync", { after, channelUuid, limit: 100 });
  }

  close() {
    this.closedByClient = true;
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
    }
  }
}
