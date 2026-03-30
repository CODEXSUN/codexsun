import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { frappeItemProductSyncLogs } from "../../src/data/frappe-seed.js"

import { frappeTableNames } from "../table-names.js"

export const frappeItemProductSyncLogsSeeder = defineDatabaseSeeder({
  id: "frappe:item-sync-logs:05-item-product-sync-logs",
  appId: "frappe",
  moduleKey: "item-sync-logs",
  name: "Seed frappe item product sync logs",
  order: 50,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      frappeTableNames.itemProductSyncLogs,
      frappeItemProductSyncLogs.map((item, index) => ({
        id: item.id,
        moduleKey: "item-sync-logs",
        sortOrder: index + 1,
        payload: item,
        updatedAt: item.syncedAt,
      }))
    )
  },
})
