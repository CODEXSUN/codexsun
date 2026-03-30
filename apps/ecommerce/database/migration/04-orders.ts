import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceOrdersMigration = defineDatabaseMigration({
  id: "ecommerce:orders:04-orders",
  appId: "ecommerce",
  moduleKey: "orders",
  name: "Create ecommerce order workflow table",
  order: 40,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, ecommerceTableNames.orderWorkflows)
  },
})
