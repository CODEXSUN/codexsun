import type { Kysely } from "kysely"

export type JsonStoreSeedRecord = {
  id: string
  moduleKey?: string | null
  sortOrder?: number
  payload: unknown
  createdAt?: string
  updatedAt?: string
}

type JsonStoreRow = {
  id: string
  module_key: string | null
  sort_order: number
  payload: string
  created_at: string
  updated_at: string
}

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export async function ensureJsonStoreTable(
  database: Kysely<unknown>,
  tableName: string
) {
  await asQueryDatabase(database).schema
    .createTable(tableName)
    .ifNotExists()
    .addColumn("id", "text", (column) => column.primaryKey())
    .addColumn("module_key", "text")
    .addColumn("sort_order", "integer", (column) =>
      column.notNull().defaultTo(0)
    )
    .addColumn("payload", "text", (column) => column.notNull())
    .addColumn("created_at", "text", (column) => column.notNull())
    .addColumn("updated_at", "text", (column) => column.notNull())
    .execute()
}

export async function replaceJsonStoreRecords(
  database: Kysely<unknown>,
  tableName: string,
  records: JsonStoreSeedRecord[]
) {
  const queryDatabase = asQueryDatabase(database)
  const timestamp = new Date().toISOString()

  await queryDatabase.deleteFrom(tableName).execute()

  if (records.length === 0) {
    return
  }

  await queryDatabase
    .insertInto(tableName)
    .values(
      records.map((record, index) => ({
        id: record.id,
        module_key: record.moduleKey ?? null,
        sort_order: record.sortOrder ?? index + 1,
        payload: JSON.stringify(record.payload),
        created_at: record.createdAt ?? timestamp,
        updated_at: record.updatedAt ?? timestamp,
      }))
    )
    .execute()
}

export async function listJsonStorePayloads<T>(
  database: Kysely<unknown>,
  tableName: string,
  moduleKey?: string
) {
  const queryDatabase = asQueryDatabase(database)
  let query = queryDatabase.selectFrom(tableName).selectAll()

  if (moduleKey) {
    query = query.where("module_key", "=", moduleKey)
  }

  const rows = (await query
    .orderBy("sort_order")
    .orderBy("id")
    .execute()) as JsonStoreRow[]

  return rows.map((row) => JSON.parse(row.payload) as T)
}

export async function getFirstJsonStorePayload<T>(
  database: Kysely<unknown>,
  tableName: string
) {
  const items = await listJsonStorePayloads<T>(database, tableName)

  return items[0] ?? null
}
