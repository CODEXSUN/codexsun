import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { coreTableNames } from "../table-names.js"

export const coreProductsMigration = defineDatabaseMigration({
  id: "core:products:12-products",
  appId: "core",
  moduleKey: "products",
  name: "Create core product table",
  order: 120,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, coreTableNames.products)
  },
})
