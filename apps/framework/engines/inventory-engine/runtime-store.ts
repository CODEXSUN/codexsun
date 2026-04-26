import type { Kysely } from "kysely"

import {
  ensureJsonStoreTable,
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../apps/framework/src/runtime/database/process/json-store.js"

export const inventoryEngineTableNames = {
  movements: "engine_inventory_movements",
  putawayTasks: "engine_inventory_putaway_tasks",
  transfers: "engine_inventory_transfers",
  reservations: "engine_inventory_reservations",
} as const

export async function listInventoryEngineRecords<T>(
  database: Kysely<unknown>,
  tableName: string
) {
  await ensureJsonStoreTable(database, tableName)
  return listJsonStorePayloads<T>(database, tableName)
}

export async function replaceInventoryEngineRecords<T extends { id: string; createdAt?: string; updatedAt?: string }>(
  database: Kysely<unknown>,
  tableName: string,
  moduleKey: string,
  items: T[]
) {
  await ensureJsonStoreTable(database, tableName)
  await replaceJsonStoreRecords(
    database,
    tableName,
    items.map((item, index) => ({
      id: item.id,
      moduleKey,
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}
