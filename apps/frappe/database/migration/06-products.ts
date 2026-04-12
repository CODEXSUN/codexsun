import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { frappeTableNames } from "../table-names.js"

export const frappeProductsMigration = defineDatabaseMigration({
  id: "frappe:products:06-products",
  appId: "frappe",
  moduleKey: "products",
  name: "Create frappe product table",
  order: 60,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, frappeTableNames.products)
  },
})
