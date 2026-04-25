import type { Kysely } from "kysely"
import { sql } from "kysely"

import type { ServerConfig } from "../../config/server-config.js"
import type { RuntimeDatabases } from "../client.js"

import { prepareApplicationDatabase } from "./runner.js"
import type {
  DatabaseFreshResult,
  DatabaseProcessLogger,
} from "./types.js"

type DatabaseDriver = ServerConfig["database"]["driver"]
type DatabaseObjectKind = "table" | "view"
type NamedDatabaseObjectRow = {
  name: string
}

function escapeIdentifier(driver: DatabaseDriver, value: string) {
  if (driver === "postgres") {
    return `"${value.replace(/"/g, '""')}"`
  }

  return `\`${value.replace(/`/g, "``")}\``
}

async function listMariadbObjects(
  database: Kysely<unknown>,
  databaseName: string,
  kind: DatabaseObjectKind
) {
  const tableType = kind === "view" ? "VIEW" : "BASE TABLE"
  const result = await sql<NamedDatabaseObjectRow>`
    select table_name as name
    from information_schema.tables
    where table_schema = ${databaseName}
      and table_type = ${tableType}
    order by table_name asc
  `.execute(database)

  return result.rows.map((row) => String(row.name))
}

async function listPostgresObjects(
  database: Kysely<unknown>,
  kind: DatabaseObjectKind
) {
  const result =
    kind === "view"
      ? await sql<NamedDatabaseObjectRow>`
          select viewname as name
          from pg_catalog.pg_views
          where schemaname = 'public'
          order by viewname asc
        `.execute(database)
      : await sql<NamedDatabaseObjectRow>`
          select tablename as name
          from pg_catalog.pg_tables
          where schemaname = 'public'
          order by tablename asc
        `.execute(database)

  return result.rows.map((row) => String(row.name))
}

async function listDatabaseObjects(
  database: Kysely<unknown>,
  options: {
    driver: DatabaseDriver
    databaseName: string
    kind: DatabaseObjectKind
  }
) {
  if (options.driver === "postgres") {
    return listPostgresObjects(database, options.kind)
  }

  return listMariadbObjects(database, options.databaseName, options.kind)
}

function buildDropStatement(
  driver: DatabaseDriver,
  kind: DatabaseObjectKind,
  objectName: string
) {
  if (driver === "postgres") {
    const keyword = kind === "view" ? "view" : "table"
    return `drop ${keyword} if exists "public".${escapeIdentifier(driver, objectName)} cascade`
  }

  const keyword = kind === "view" ? "view" : "table"
  return `drop ${keyword} if exists ${escapeIdentifier(driver, objectName)}`
}

async function dropDatabaseObjects(
  database: Kysely<unknown>,
  options: {
    driver: DatabaseDriver
    databaseName: string
    kind: DatabaseObjectKind
    logger?: DatabaseProcessLogger
  }
) {
  const objectNames = await listDatabaseObjects(database, options)

  for (const objectName of objectNames) {
    options.logger?.info(
      `Dropping ${options.kind} ${objectName} from ${options.databaseName}`
    )
    await sql.raw(
      buildDropStatement(options.driver, options.kind, objectName)
    ).execute(database)
  }

  return objectNames.length
}

async function resetMariadbSchema(
  database: Kysely<unknown>,
  options: {
    databaseName: string
    logger?: DatabaseProcessLogger
  }
) {
  await sql.raw("set foreign_key_checks = 0").execute(database)

  try {
    const droppedViews = await dropDatabaseObjects(database, {
      driver: "mariadb",
      databaseName: options.databaseName,
      kind: "view",
      logger: options.logger,
    })
    const droppedTables = await dropDatabaseObjects(database, {
      driver: "mariadb",
      databaseName: options.databaseName,
      kind: "table",
      logger: options.logger,
    })

    return {
      views: droppedViews,
      tables: droppedTables,
    }
  } finally {
    await sql.raw("set foreign_key_checks = 1").execute(database)
  }
}

async function resetPostgresSchema(
  database: Kysely<unknown>,
  options: {
    databaseName: string
    logger?: DatabaseProcessLogger
  }
) {
  const droppedViews = await dropDatabaseObjects(database, {
    driver: "postgres",
    databaseName: options.databaseName,
    kind: "view",
    logger: options.logger,
  })
  const droppedTables = await dropDatabaseObjects(database, {
    driver: "postgres",
    databaseName: options.databaseName,
    kind: "table",
    logger: options.logger,
  })

  return {
    views: droppedViews,
    tables: droppedTables,
  }
}

async function resetApplicationDatabase(
  database: Kysely<unknown>,
  options: {
    driver: DatabaseDriver
    databaseName?: string
    logger?: DatabaseProcessLogger
  }
) {
  const databaseName = options.databaseName?.trim()

  if (!databaseName) {
    throw new Error("DB_NAME is required for db:fresh.")
  }

  options.logger?.info(`Resetting database ${databaseName} (${options.driver})`)

  if (options.driver === "postgres") {
    return resetPostgresSchema(database, {
      databaseName,
      logger: options.logger,
    })
  }

  return resetMariadbSchema(database, {
    databaseName,
    logger: options.logger,
  })
}

export async function freshApplicationDatabase(
  databases: RuntimeDatabases,
  options: {
    driver: DatabaseDriver
    databaseName?: string
    logger?: DatabaseProcessLogger
  } = {
    driver: "mariadb",
  }
): Promise<DatabaseFreshResult> {
  const dropped = await resetApplicationDatabase(databases.primary, options)
  const prepared = await prepareApplicationDatabase(databases, {
    logger: options.logger,
  })

  return {
    dropped,
    migrations: prepared.migrations,
    seeders: prepared.seeders,
  }
}
