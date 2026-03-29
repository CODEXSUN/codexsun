import { mkdirSync } from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"
import { Kysely, MysqlDialect, PostgresDialect, SqliteDialect, sql } from "kysely"
import mariadb from "mysql2/promise"
import pg from "pg"

import type { ServerConfig } from "../config/index.js"

export type RuntimeDatabases = {
  primary: Kysely<unknown>
  offline?: Kysely<unknown>
  analytics?: Kysely<unknown>
  metadata: {
    primaryDriver: ServerConfig["database"]["driver"]
    offlineEnabled: boolean
    analyticsEnabled: boolean
  }
  destroy: () => Promise<void>
}

function createSqliteDatabase(filename: string) {
  mkdirSync(path.dirname(filename), { recursive: true })
  return new Database(filename)
}

function createPrimaryDatabase(config: ServerConfig) {
  const { database } = config

  switch (database.driver) {
    case "sqlite":
      return new Kysely({
        dialect: new SqliteDialect({
          database: createSqliteDatabase(database.sqliteFile),
        }),
      })
    case "postgres":
      return new Kysely({
        dialect: new PostgresDialect({
          pool: new pg.Pool({
            host: database.host,
            port: database.port ?? 5432,
            database: database.name,
            user: database.user,
            password: database.password,
            ssl: database.ssl ? { rejectUnauthorized: false } : undefined,
            max: 10,
          }),
        }),
      })
    case "mariadb":
    default:
      return new Kysely({
        dialect: new MysqlDialect({
          pool: mariadb.createPool({
            host: database.host ?? "127.0.0.1",
            port: database.port ?? 3306,
            database: database.name,
            user: database.user,
            password: database.password,
            ssl: database.ssl ? {} : undefined,
            connectionLimit: 10,
            enableKeepAlive: true,
          }),
        }),
      })
  }
}

function createAnalyticsDatabase(config: ServerConfig) {
  if (!config.analytics.enabled) {
    return undefined
  }

  return new Kysely({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        host: config.analytics.host,
        port: config.analytics.port ?? 5432,
        database: config.analytics.name,
        user: config.analytics.user,
        password: config.analytics.password,
        ssl: config.analytics.ssl ? { rejectUnauthorized: false } : undefined,
        max: 5,
      }),
    }),
  })
}

export function createRuntimeDatabases(config: ServerConfig): RuntimeDatabases {
  const sqliteClosers: Array<() => void> = []

  const primary =
    config.database.driver === "sqlite"
      ? new Kysely({
          dialect: new SqliteDialect({
            database: (() => {
              const database = createSqliteDatabase(config.database.sqliteFile)
              sqliteClosers.push(() => database.close())
              return database
            })(),
          }),
        })
      : createPrimaryDatabase(config)

  const offline =
    config.offline.enabled
      ? new Kysely({
          dialect: new SqliteDialect({
            database: (() => {
              const database = createSqliteDatabase(config.offline.sqliteFile)
              sqliteClosers.push(() => database.close())
              return database
            })(),
          }),
        })
      : undefined
  const analytics = createAnalyticsDatabase(config)

  return {
    primary,
    offline,
    analytics,
    metadata: {
      primaryDriver: config.database.driver,
      offlineEnabled: config.offline.enabled,
      analyticsEnabled: config.analytics.enabled,
    },
    destroy: async () => {
      await primary.destroy()

      if (offline) {
        await offline.destroy()
      }

      if (analytics) {
        await analytics.destroy()
      }

      for (const closeSqlite of sqliteClosers) {
        closeSqlite()
      }
    },
  }
}

export async function probeDatabase(database: Kysely<unknown>) {
  await sql`select 1 as ok`.execute(database)
}
