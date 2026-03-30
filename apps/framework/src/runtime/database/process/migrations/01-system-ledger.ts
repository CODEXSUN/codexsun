import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../types.js"

import {
  systemMigrationTableName,
  systemSeederTableName,
} from "../table-names.js"

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

export const frameworkSystemLedgerMigration = defineDatabaseMigration({
  id: "framework:runtime:01-system-ledger",
  appId: "framework",
  moduleKey: "runtime-ledger",
  name: "Create migration and seeder ledger tables",
  order: 10,
  up: async ({ database }) => {
    await ensureProcessLedgerTable(database, systemMigrationTableName)
    await ensureProcessLedgerTable(database, systemSeederTableName)
  },
})
