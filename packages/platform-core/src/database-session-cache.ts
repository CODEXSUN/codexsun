import type { CacheStore, SessionStore } from "@codexsun/framework";
import type { Kysely } from "kysely";

export interface SessionCacheDatabase {
  platform_sessions: {
    id: string;
    scope: string;
    value: string;
    expires_at: string;
    updated_at: string;
  };
  platform_cache: {
    scope: string;
    key: string;
    value: string;
    expires_at: string | null;
    updated_at: string;
  };
}

export const sessionCacheMigration = {
  id: "platform.session-cache.001",
  owner: "platform.session-cache",
  description: "Create isolated database session and cache stores.",
  async apply(database: Kysely<SessionCacheDatabase>): Promise<void> {
    await database.schema
      .createTable("platform_sessions")
      .ifNotExists()
      .addColumn("id", "varchar(200)", (column) => column.primaryKey())
      .addColumn("scope", "varchar(120)", (column) => column.notNull())
      .addColumn("value", "text", (column) => column.notNull())
      .addColumn("expires_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();
    await database.schema
      .createTable("platform_cache")
      .ifNotExists()
      .addColumn("scope", "varchar(120)", (column) => column.notNull())
      .addColumn("key", "varchar(200)", (column) => column.notNull())
      .addColumn("value", "text", (column) => column.notNull())
      .addColumn("expires_at", "varchar(40)")
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addPrimaryKeyConstraint("platform_cache_primary", ["scope", "key"])
      .execute();
  },
};

export class DatabaseSessionStore<TSession = Readonly<Record<string, unknown>>> implements SessionStore<TSession> {
  constructor(private readonly database: Kysely<SessionCacheDatabase>, private readonly scope: string) {}

  async get(id: string): Promise<TSession | undefined> {
    const row = await this.database.selectFrom("platform_sessions").selectAll().where("id", "=", id).where("scope", "=", this.scope).executeTakeFirst();
    if (!row) return undefined;
    if (Date.parse(row.expires_at) <= Date.now()) {
      await this.delete(id);
      return undefined;
    }
    return JSON.parse(row.value) as TSession;
  }

  async put(id: string, session: TSession, expiresAt: string): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.database.selectFrom("platform_sessions").select("id").where("id", "=", id).where("scope", "=", this.scope).executeTakeFirst();
    if (existing) {
      await this.database.updateTable("platform_sessions").set({ value: JSON.stringify(session), expires_at: expiresAt, updated_at: now }).where("id", "=", id).where("scope", "=", this.scope).execute();
      return;
    }
    await this.database.insertInto("platform_sessions").values({ id, scope: this.scope, value: JSON.stringify(session), expires_at: expiresAt, updated_at: now }).execute();
  }

  async delete(id: string): Promise<void> {
    await this.database.deleteFrom("platform_sessions").where("id", "=", id).where("scope", "=", this.scope).execute();
  }
}

export class DatabaseCacheStore implements CacheStore {
  constructor(private readonly database: Kysely<SessionCacheDatabase>, private readonly scope: string) {}

  async get<T>(key: string): Promise<T | undefined> {
    const row = await this.database.selectFrom("platform_cache").selectAll().where("scope", "=", this.scope).where("key", "=", key).executeTakeFirst();
    if (!row || (row.expires_at !== null && Date.parse(row.expires_at) <= Date.now())) {
      if (row) await this.delete(key);
      return undefined;
    }
    return JSON.parse(row.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined && (!Number.isInteger(ttlSeconds) || ttlSeconds < 1)) throw new Error("Cache TTL must be a positive integer.");
    const now = new Date().toISOString();
    const expiresAt = ttlSeconds === undefined ? null : new Date(Date.now() + ttlSeconds * 1_000).toISOString();
    const existing = await this.database.selectFrom("platform_cache").select("key").where("scope", "=", this.scope).where("key", "=", key).executeTakeFirst();
    if (existing) {
      await this.database.updateTable("platform_cache").set({ value: JSON.stringify(value), expires_at: expiresAt, updated_at: now }).where("scope", "=", this.scope).where("key", "=", key).execute();
      return;
    }
    await this.database.insertInto("platform_cache").values({ scope: this.scope, key, value: JSON.stringify(value), expires_at: expiresAt, updated_at: now }).execute();
  }

  async delete(key: string): Promise<void> {
    await this.database.deleteFrom("platform_cache").where("scope", "=", this.scope).where("key", "=", key).execute();
  }
}
