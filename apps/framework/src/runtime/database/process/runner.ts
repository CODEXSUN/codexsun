import type { Kysely } from "kysely"

import type { RuntimeDatabases } from "../client.js"

import {
  listRegisteredDatabaseMigrations,
  listRegisteredDatabaseSeeders,
} from "./registry.js"
import {
  systemMigrationTableName,
  systemSeederTableName,
} from "./table-names.js"
import type {
  DatabasePrepareResult,
  DatabaseProcessLogger,
  DatabaseProcessMigration,
  DatabaseProcessRunResult,
  DatabaseProcessSeeder,
} from "./types.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

async function ensureProcessLedgerTable(
  database: Kysely<unknown>,
  tableName: string
) {
  await asQueryDatabase(database).schema
    .createTable(tableName)
    .ifNotExists()
    .addColumn("id", "text", (column) => column.primaryKey())
    .addColumn("app_id", "text", (column) => column.notNull())
    .addColumn("module_key", "text", (column) => column.notNull())
    .addColumn("name", "text", (column) => column.notNull())
    .addColumn("applied_at", "text", (column) => column.notNull())
    .execute()
}

async function ensureProcessLedger(database: Kysely<unknown>) {
  await ensureProcessLedgerTable(database, systemMigrationTableName)
  await ensureProcessLedgerTable(database, systemSeederTableName)
}

async function listAppliedProcessIds(
  database: Kysely<unknown>,
  tableName: string
) {
  const rows = (await asQueryDatabase(database)
    .selectFrom(tableName)
    .select(["id"])
    .execute()) as Array<{ id: string }>

  return new Set(rows.map((row) => row.id))
}

async function recordAppliedProcess(
  database: Kysely<unknown>,
  tableName: string,
  process: DatabaseProcessMigration | DatabaseProcessSeeder
) {
  await asQueryDatabase(database)
    .insertInto(tableName)
    .values({
      id: process.id,
      app_id: process.appId,
      module_key: process.moduleKey,
      name: process.name,
      applied_at: new Date().toISOString(),
    })
    .execute()
}

export async function runDatabaseMigrations(
  database: Kysely<unknown>,
  options: {
    logger?: DatabaseProcessLogger
    migrations?: DatabaseProcessMigration[]
  } = {}
): Promise<DatabaseProcessRunResult> {
  await ensureProcessLedger(database)

  const logger = options.logger
  const migrations = options.migrations ?? listRegisteredDatabaseMigrations()
  const appliedMigrationIds = await listAppliedProcessIds(
    database,
    systemMigrationTableName
  )
  const result: DatabaseProcessRunResult = {
    applied: [],
    skipped: [],
  }

  for (const migration of migrations) {
    if (appliedMigrationIds.has(migration.id)) {
      result.skipped.push(migration.id)
      continue
    }

    logger?.info(
      `Applying migration ${migration.id} (${migration.appId}/${migration.moduleKey})`
    )

    await migration.up({ database })
    await recordAppliedProcess(database, systemMigrationTableName, migration)

    result.applied.push(migration.id)
  }

  return result
}

export async function runDatabaseSeeders(
  database: Kysely<unknown>,
  options: {
    logger?: DatabaseProcessLogger
    seeders?: DatabaseProcessSeeder[]
  } = {}
): Promise<DatabaseProcessRunResult> {
  await ensureProcessLedger(database)

  const logger = options.logger
  const seeders = options.seeders ?? listRegisteredDatabaseSeeders()
  const appliedSeederIds = await listAppliedProcessIds(
    database,
    systemSeederTableName
  )
  const result: DatabaseProcessRunResult = {
    applied: [],
    skipped: [],
  }

  for (const seeder of seeders) {
    if (appliedSeederIds.has(seeder.id)) {
      result.skipped.push(seeder.id)
      continue
    }

    logger?.info(
      `Applying seeder ${seeder.id} (${seeder.appId}/${seeder.moduleKey})`
    )

    await seeder.run({ database })
    await recordAppliedProcess(database, systemSeederTableName, seeder)

    result.applied.push(seeder.id)
  }

  return result
}

export async function prepareApplicationDatabase(
  databases: RuntimeDatabases,
  options: {
    logger?: DatabaseProcessLogger
  } = {}
): Promise<DatabasePrepareResult> {
  const migrations = await runDatabaseMigrations(databases.primary, {
    logger: options.logger,
  })
  const seeders = await runDatabaseSeeders(databases.primary, {
    logger: options.logger,
  })

  return {
    migrations,
    seeders,
  }
}
