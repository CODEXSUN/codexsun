import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { frappeTableNames } from "../table-names.js"

export const frappeItemProductMappingsMigration = defineDatabaseMigration({
  id: "frappe:item-product-mappings:07-item-product-mappings",
  appId: "frappe",
  moduleKey: "item-product-mappings",
  name: "Create frappe item product mapping table",
  order: 70,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, frappeTableNames.itemProductMappings)
  },
})
