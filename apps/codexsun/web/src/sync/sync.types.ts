import type { RequirementRecord } from "../modules/requirements";

export type CodexsunSyncScope = { tenantUuid: string; actorEmail: string };
export type CodexsunSyncGateway = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
};
export type CodexsunDraft = {
  clientKey: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  origin: "web" | "desktop" | "mobile";
};
export type CodexsunOutboxEntry = { draft: CodexsunDraft; queuedAt: string };
export type CodexsunCache = { records: RequirementRecord[]; syncedAt: string | null };
export interface CodexsunSyncStorage {
  list(): Promise<CodexsunOutboxEntry[]>;
  put(entry: CodexsunOutboxEntry): Promise<void>;
  acknowledge(clientKey: string): Promise<void>;
  readCache(): Promise<CodexsunCache>;
  writeCache(cache: CodexsunCache): Promise<void>;
  deviceKey(kind: CodexsunDraft["origin"]): Promise<string>;
}
export function codexsunScopeKey(scope: CodexsunSyncScope): string {
  return JSON.stringify([scope.tenantUuid, scope.actorEmail.toLowerCase()]);
}
