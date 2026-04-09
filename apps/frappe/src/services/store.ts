import type { Kysely } from "kysely"
import type { ZodType } from "zod"

import {
  ensureJsonStoreTable,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"

type JsonStoreRecord<T> = {
  id: string
  moduleKey: string
  sortOrder?: number
  payload: T
  createdAt?: string
  updatedAt?: string
}

type DynamicDatabase = Record<string, Record<string, unknown>>
type JsonStoreRow = {
  id: string
  payload: string
}

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export async function listStorePayloads<T>(
  database: Kysely<unknown>,
  tableName: string,
  schema: ZodType<T>
) {
  await ensureJsonStoreTable(database, tableName)

  const rows = (await asQueryDatabase(database)
    .selectFrom(tableName)
    .select(["id", "payload"])
    .orderBy("sort_order")
    .orderBy("id")
    .execute()) as JsonStoreRow[]

  return rows.map((row) => schema.parse(JSON.parse(row.payload)))
}

export async function listStorePayloadsRaw(
  database: Kysely<unknown>,
  tableName: string
) {
  await ensureJsonStoreTable(database, tableName)

  const rows = (await asQueryDatabase(database)
    .selectFrom(tableName)
    .select(["id", "payload"])
    .orderBy("sort_order")
    .orderBy("id")
    .execute()) as JsonStoreRow[]

  return rows.map((row) => JSON.parse(row.payload) as unknown)
}

export async function getStorePayloadById<T>(
  database: Kysely<unknown>,
  tableName: string,
  id: string,
  schema: ZodType<T>
) {
  await ensureJsonStoreTable(database, tableName)

  const row = (await asQueryDatabase(database)
    .selectFrom(tableName)
    .select(["id", "payload"])
    .where("id", "=", id)
    .executeTakeFirst()) as JsonStoreRow | undefined

  if (!row) {
    return null
  }

  return schema.parse(JSON.parse(row.payload))
}

export async function replaceStorePayloads<T>(
  database: Kysely<unknown>,
  tableName: string,
  records: JsonStoreRecord<T>[]
) {
  await ensureJsonStoreTable(database, tableName)

  await replaceJsonStoreRecords(
    database,
    tableName,
    records.map((record, index) => ({
      id: record.id,
      moduleKey: record.moduleKey,
      sortOrder: record.sortOrder ?? index + 1,
      payload: record.payload,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }))
  )
}
