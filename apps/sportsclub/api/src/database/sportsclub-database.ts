/**
 * @file Multi-Tenant Database Manager for Sportsclub
 *
 * Implements connection lifecycle, connection pooling with idle eviction,
 * migration runners, and seed orchestrators mirroring Billing's architecture.
 */

import { Kysely, MysqlDialect } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import type { SportsclubDatabase } from "../sportsclub.types.js";
import {
  migrateSportsclubDatabase,
  rollbackSportsclubDatabase
} from "../sportsclub.migration.js";
import { seedSportsclubDatabase } from "../sportsclub.seed.js";

export const TENKASISPORTS_DB_NAME = "codexsun_sportsclub_tenkasisports";

export type TenantConnectionOptions = {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
};

type SportsclubConnectionEntry = {
  database: Kysely<SportsclubDatabase>;
  lastUsedAt: number;
};

const connections = new Map<string, SportsclubConnectionEntry>();
const tenantConnectionOptions = new Map<string, TenantConnectionOptions>();
const migrated = new Set<string>();
const connectionIdleMs = 10 * 60 * 1000;

export function resolveSportsclubDatabaseName(raw?: string | null): string {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value || value === "tenkasisports" || value === "tenkasi" || value === TENKASISPORTS_DB_NAME) {
    return TENKASISPORTS_DB_NAME;
  }
  return value.replace(/[^a-z0-9_]/g, "_");
}

export function registerSportsclubTenantDatabaseConnection(
  tenantDatabase: string,
  database: Kysely<SportsclubDatabase>
): void {
  const name = resolveSportsclubDatabaseName(tenantDatabase);
  connections.set(name, {
    database,
    lastUsedAt: Date.now()
  });
}

export function setSportsclubTenantConnectionOptions(
  tenantDatabase: string,
  options: TenantConnectionOptions
): void {
  const name = resolveSportsclubDatabaseName(tenantDatabase);
  tenantConnectionOptions.set(name, options);
}

export async function getSportsclubDatabase(
  tenantDatabase: string
): Promise<Kysely<SportsclubDatabase>> {
  const name = resolveSportsclubDatabaseName(tenantDatabase);
  const existing = connections.get(name);
  if (existing) {
    existing.lastUsedAt = Date.now();
    return existing.database;
  }

  const custom = tenantConnectionOptions.get(name);
  const host = custom?.host ?? process.env.DB_HOST ?? "127.0.0.1";
  const port = custom?.port ?? Number(process.env.DB_PORT ?? 3306);
  const user = custom?.user ?? process.env.DB_USER ?? "root";
  const password = custom?.password ?? process.env.DB_PASSWORD ?? "";
  const database = custom?.database ?? name;

  const poolOptions: PoolOptions = {
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  };

  const pool = createPool(poolOptions);
  const db = new Kysely<SportsclubDatabase>({
    dialect: new MysqlDialect({ pool })
  });

  connections.set(name, {
    database: db,
    lastUsedAt: Date.now()
  });

  return db;
}

export async function closeAllSportsclubDatabases(): Promise<void> {
  const entries = Array.from(connections.entries());
  connections.clear();
  migrated.clear();

  for (const [, entry] of entries) {
    try {
      await entry.database.destroy();
    } catch {
      // Ignore destroy errors during teardown
    }
  }
}

export async function evictIdleSportsclubDatabases(): Promise<void> {
  const now = Date.now();
  for (const [name, entry] of connections.entries()) {
    if (now - entry.lastUsedAt > connectionIdleMs) {
      connections.delete(name);
      try {
        await entry.database.destroy();
      } catch {
        // Ignore destroy errors on idle eviction
      }
    }
  }
}

export async function migrateSportsclubTenantDatabase(tenantDatabase: string): Promise<void> {
  const db = await getSportsclubDatabase(tenantDatabase);
  await migrateSportsclubDatabase(db);
  migrated.add(resolveSportsclubDatabaseName(tenantDatabase));
}

export async function seedSportsclubTenantDatabase(tenantDatabase: string): Promise<void> {
  const db = await getSportsclubDatabase(tenantDatabase);
  await seedSportsclubDatabase(db);
}

export async function rollbackSportsclubTenantDatabase(tenantDatabase: string): Promise<void> {
  const name = resolveSportsclubDatabaseName(tenantDatabase);
  const db = await getSportsclubDatabase(tenantDatabase);
  await rollbackSportsclubDatabase(db);
  migrated.delete(name);
}

export async function bootstrapSportsclubDatabase(tenantDatabase: string): Promise<void> {
  await migrateSportsclubTenantDatabase(tenantDatabase);
  await seedSportsclubTenantDatabase(tenantDatabase);
}
