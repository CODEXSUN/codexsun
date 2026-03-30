import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { frappeTableNames } from "../table-names.js"

export const frappeItemsMigration = defineDatabaseMigration({
  id: "frappe:items:03-items",
  appId: "frappe",
  moduleKey: "items",
  name: "Create frappe item table",
  order: 30,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, frappeTableNames.items)
  },
})
