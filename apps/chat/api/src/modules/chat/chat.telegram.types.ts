import type { ChatRuntimeContext } from "./chat.types.js";

export type TelegramScope = Pick<ChatRuntimeContext, "database" | "tenantDatabase" | "tenantId">;
export type TelegramCredentials = {
  apiId: number;
  apiHash: string;
  phone: string;
  session: string;
  phoneCodeHash?: string;
  input?: string;
  userId?: string;
};
export type TelegramPeer = { kind: "user" | "chat" | "channel"; id: string; accessHash?: string };
export type TelegramRemoteDialog = {
  key: string;
  title: string;
  peer: TelegramPeer;
  lastMessageId: number;
};
export type TelegramRemoteMessage = { id: number; text: string; sender: string };
export type TelegramClientApi = {
  connect(): Promise<void>;
  close(): Promise<void>;
  saveSession(): string;
  sendCode(): Promise<string>;
  signIn(code: string): Promise<boolean>;
  password(password: string): Promise<void>;
  identity(): Promise<{ id: string; label: string }>;
  dialogs(): Promise<TelegramRemoteDialog[]>;
  messages(peer: TelegramPeer, after: number): Promise<TelegramRemoteMessage[]>;
  send(peer: TelegramPeer, text: string, randomId: string): Promise<number>;
  logout(): Promise<void>;
};
export type TelegramAccount = {
  uuid: string;
  apiId: number;
  phoneLabel: string;
  accountLabel: string;
  authState: string;
  lastError: string | null;
  lastSyncedAt: string | null;
};
export type TelegramAccountRow = Record<string, unknown> & {
  id: number;
  uuid: string;
  company_id: number;
  actor_email: string;
  api_id: number;
  credentials_encrypted: string;
  auth_state: string;
  operation_id: string;
};
export type TelegramDialogRow = Record<string, unknown> & {
  id: number;
  uuid: string;
  account_uuid: string;
  peer_key: string;
  title: string;
  peer_encrypted: string;
  channel_uuid: string | null;
  last_received_id: number;
  last_sent_id: number;
};
export type TelegramDependencies = {
  secretKey: string;
  scopes: () => Promise<TelegramScope[]>;
  authorize: (scope: TelegramScope, actorEmail: string) => Promise<void>;
  clientFactory?: (credentials: TelegramCredentials) => TelegramClientApi;
  enqueue: (input: {
    jobName: string;
    queueName: string;
    sourceModule: string;
    tenantId: string;
    correlationId: string;
    idempotencyKey: string;
    maxAttempts: number;
    payload: Record<string, unknown>;
  }) => Promise<unknown>;
  registerProcessor: (
    processor: (
      tenantId: string,
      accountUuid: string,
      operationId: string
    ) => Promise<Record<string, unknown>>
  ) => void;
};
