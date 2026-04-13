import { Kysely, MysqlDialect, PostgresDialect, sql } from "kysely"
import mariadb from "mysql2"
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

function createPrimaryDatabase(config: ServerConfig) {
  const { database } = config

  switch (database.driver) {
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
            connectionTimeoutMillis: 5_000,
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
            connectTimeout: 5_000,
            connectionLimit: 10,
            enableKeepAlive: true,
            waitForConnections: true,
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
        connectionTimeoutMillis: 5_000,
        max: 5,
      }),
    }),
  })
}

export function createRuntimeDatabases(config: ServerConfig): RuntimeDatabases {
  const primary = createPrimaryDatabase(config)
  const offline: Kysely<unknown> | undefined = undefined
  const analytics = createAnalyticsDatabase(config)

  return {
    primary,
    offline,
    analytics,
    metadata: {
      primaryDriver: config.database.driver,
      offlineEnabled: false,
      analyticsEnabled: config.analytics.enabled,
    },
    destroy: async () => {
      await primary.destroy()

      if (analytics) {
        await analytics.destroy()
      }
    },
  }
}

export async function probeDatabase(database: Kysely<unknown>) {
  await sql`select 1 as ok`.execute(database)
}
