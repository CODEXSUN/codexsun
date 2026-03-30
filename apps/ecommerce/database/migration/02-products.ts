import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceProductsMigration = defineDatabaseMigration({
  id: "ecommerce:products:02-products",
  appId: "ecommerce",
  moduleKey: "products",
  name: "Create ecommerce product table",
  order: 20,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, ecommerceTableNames.products)
  },
})
