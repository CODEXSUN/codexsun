import type { Kysely } from "kysely"

import {
  ensureJsonStoreTable,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type JsonStoreRow = {
  id: string
  module_key: string | null
  sort_order: number
  payload: string
  created_at: string
  updated_at: string
}

export type ZetroStoreRecord<T> = {
  id: string
  moduleKey?: string | null
  sortOrder?: number
  payload: T
  createdAt?: string
  updatedAt?: string
}

export function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function mapJsonStoreRow<T>(row: JsonStoreRow): ZetroStoreRecord<T> {
  return {
    id: row.id,
    moduleKey: row.module_key,
    sortOrder: row.sort_order,
    payload: JSON.parse(row.payload) as T,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listStoreRecords<T>(
  database: Kysely<unknown>,
  tableName: string,
  moduleKey?: string
) {
  await ensureJsonStoreTable(database, tableName)

  let query = asQueryDatabase(database).selectFrom(tableName).selectAll()

  if (moduleKey) {
    query = query.where("module_key", "=", moduleKey)
  }

  const rows = (await query
    .orderBy("sort_order")
    .orderBy("id")
    .execute()) as JsonStoreRow[]

  return rows.map((row) => mapJsonStoreRow<T>(row))
}

export async function listStorePayloads<T>(
  database: Kysely<unknown>,
  tableName: string,
  moduleKey?: string
) {
  const records = await listStoreRecords<T>(database, tableName, moduleKey)

  return records.map((record) => record.payload)
}

export async function getStoreRecordById<T>(
  database: Kysely<unknown>,
  tableName: string,
  id: string
) {
  await ensureJsonStoreTable(database, tableName)

  const row = (await asQueryDatabase(database)
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()) as JsonStoreRow | undefined

  return row ? mapJsonStoreRow<T>(row) : null
}

export async function getStorePayloadById<T>(
  database: Kysely<unknown>,
  tableName: string,
  id: string
) {
  const record = await getStoreRecordById<T>(database, tableName, id)

  return record?.payload ?? null
}

export async function replaceStoreRecords<T>(
  database: Kysely<unknown>,
  tableName: string,
  records: ZetroStoreRecord<T>[]
) {
  await ensureJsonStoreTable(database, tableName)
  await replaceJsonStoreRecords(database, tableName, records)
}
