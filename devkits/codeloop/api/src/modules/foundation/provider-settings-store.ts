import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type StoredProviderId = "anthropic" | "codex" | "gemini" | "ollama" | "openai" | "openrouter";

export type ProviderSettingsInput = {
  readonly apiKey?: string;
  readonly enabled: boolean;
  readonly endpoint: string;
  readonly model: string;
  readonly providerId: StoredProviderId;
};

export type ProviderSettings = ProviderSettingsInput & {
  readonly apiKeyConfigured: boolean;
  readonly apiKeyHint?: string;
  readonly updatedAt: string;
};

export type ConversationProviderBinding = {
  readonly conversationId: string;
  readonly model: string;
  readonly providerId: StoredProviderId;
  readonly updatedAt: string;
};

type ProviderRow = { provider_id: StoredProviderId; enabled: number; endpoint: string; model: string; api_key_ciphertext?: string | null; api_key_hint?: string | null; updated_at: string };

export class ProviderSettingsStore {
  private readonly database: DatabaseSync;
  private readonly key: Buffer;
  private defaults: readonly ProviderSettingsInput[] = [];

  constructor(databasePath: string, encryptionSecret: string) {
    if (!existsSync(databasePath)) mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    this.key = createHash("sha256").update(encryptionSecret).digest();
  }

  initialize(defaults: readonly ProviderSettingsInput[]): void {
    this.defaults = defaults;
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS codeloop_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL,
        checksum TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS codeloop_provider_settings (
        owner_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
        endpoint TEXT NOT NULL,
        model TEXT NOT NULL,
        api_key_ciphertext TEXT,
        api_key_hint TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (owner_id, provider_id)
      );
      CREATE TABLE IF NOT EXISTS codeloop_conversation_provider_bindings (
        owner_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        model TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (owner_id, conversation_id, provider_id)
      );
    `);
    const migration = this.database.prepare("SELECT id FROM codeloop_migrations WHERE id = ?").get("codeloop.provider-settings.001");
    if (!migration) this.database.prepare("INSERT INTO codeloop_migrations (id, applied_at, checksum) VALUES (?, ?, ?)").run("codeloop.provider-settings.001", new Date().toISOString(), "codeloop-provider-settings-v1");
    const owner = "__defaults__";
    const count = Number((this.database.prepare("SELECT COUNT(*) AS count FROM codeloop_provider_settings WHERE owner_id = ?").get(owner) as { count: number }).count);
    if (!count) this.replace(owner, defaults);
  }

  list(ownerId: string): readonly ProviderSettings[] {
    let rows = this.database.prepare("SELECT provider_id, enabled, endpoint, model, api_key_ciphertext, api_key_hint, updated_at FROM codeloop_provider_settings WHERE owner_id = ? ORDER BY provider_id").all(ownerId) as ProviderRow[];
    if (!rows.length && ownerId !== "__defaults__") {
      this.replace(ownerId, this.defaults);
      rows = this.database.prepare("SELECT provider_id, enabled, endpoint, model, api_key_ciphertext, api_key_hint, updated_at FROM codeloop_provider_settings WHERE owner_id = ? ORDER BY provider_id").all(ownerId) as ProviderRow[];
    }
    return rows.map((row) => ({
      apiKey: undefined,
      apiKeyConfigured: Boolean(row.api_key_ciphertext),
      apiKeyHint: row.api_key_hint ?? undefined,
      enabled: Boolean(row.enabled),
      endpoint: String(row.endpoint),
      model: String(row.model),
      providerId: row.provider_id,
      updatedAt: String(row.updated_at),
    }));
  }

  replace(ownerId: string, providers: readonly ProviderSettingsInput[]): readonly ProviderSettings[] {
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const existing = this.database.prepare("SELECT provider_id, api_key_ciphertext, api_key_hint FROM codeloop_provider_settings WHERE owner_id = ?").all(ownerId) as { provider_id: string; api_key_ciphertext?: string | null; api_key_hint?: string | null }[];
      const existingById = new Map(existing.map((row) => [row.provider_id, row]));
      const upsert = this.database.prepare("INSERT INTO codeloop_provider_settings (owner_id, provider_id, enabled, endpoint, model, api_key_ciphertext, api_key_hint, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(owner_id, provider_id) DO UPDATE SET enabled = excluded.enabled, endpoint = excluded.endpoint, model = excluded.model, api_key_ciphertext = excluded.api_key_ciphertext, api_key_hint = excluded.api_key_hint, updated_at = excluded.updated_at");
      for (const provider of providers) {
        const previous = existingById.get(provider.providerId);
        const encrypted = provider.apiKey?.trim() ? this.encrypt(provider.apiKey.trim()) : previous?.api_key_ciphertext ?? null;
        const hint = provider.apiKey?.trim() ? `${provider.apiKey.trim().slice(0, 8)}…` : previous?.api_key_hint ?? null;
        upsert.run(ownerId, provider.providerId, provider.enabled ? 1 : 0, provider.endpoint.trim(), provider.model.trim(), encrypted, hint, now);
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.list(ownerId);
  }

  getSecrets(ownerId: string, providerIds: readonly StoredProviderId[]): readonly ProviderSettingsInput[] {
    if (!providerIds.length) return [];
    const rows = this.database.prepare("SELECT provider_id, enabled, endpoint, model, api_key_ciphertext FROM codeloop_provider_settings WHERE owner_id = ? AND provider_id IN (" + providerIds.map(() => "?").join(",") + ")").all(ownerId, ...providerIds) as ProviderRow[];
    return rows.map((row) => ({ apiKey: row.api_key_ciphertext ? this.decrypt(row.api_key_ciphertext) : undefined, enabled: Boolean(row.enabled), endpoint: String(row.endpoint), model: String(row.model), providerId: row.provider_id }));
  }

  listBindings(ownerId: string, conversationId: string): readonly ConversationProviderBinding[] {
    return (this.database.prepare("SELECT conversation_id, provider_id, model, updated_at FROM codeloop_conversation_provider_bindings WHERE owner_id = ? AND conversation_id = ? ORDER BY provider_id").all(ownerId, conversationId) as { conversation_id: string; provider_id: StoredProviderId; model: string; updated_at: string }[]).map((row) => ({ conversationId: row.conversation_id, model: row.model, providerId: row.provider_id, updatedAt: row.updated_at }));
  }

  replaceBindings(ownerId: string, conversationId: string, bindings: readonly Pick<ConversationProviderBinding, "model" | "providerId">[]): readonly ConversationProviderBinding[] {
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare("DELETE FROM codeloop_conversation_provider_bindings WHERE owner_id = ? AND conversation_id = ?").run(ownerId, conversationId);
      const insert = this.database.prepare("INSERT INTO codeloop_conversation_provider_bindings (owner_id, conversation_id, provider_id, model, updated_at) VALUES (?, ?, ?, ?, ?)");
      for (const binding of bindings) insert.run(ownerId, conversationId, binding.providerId, binding.model, now);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.listBindings(ownerId, conversationId);
  }

  close(): void { this.database.close(); }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
  }

  private decrypt(value: string): string {
    const [ivText, tagText, dataText] = value.split(".");
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(dataText, "base64url")), decipher.final()]).toString("utf8");
  }
}
