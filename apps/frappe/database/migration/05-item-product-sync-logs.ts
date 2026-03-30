import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { frappeTableNames } from "../table-names.js"

export const frappeItemProductSyncLogsMigration = defineDatabaseMigration({
  id: "frappe:item-sync-logs:05-item-product-sync-logs",
  appId: "frappe",
  moduleKey: "item-sync-logs",
  name: "Create frappe item product sync log table",
  order: 50,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, frappeTableNames.itemProductSyncLogs)
  },
})
