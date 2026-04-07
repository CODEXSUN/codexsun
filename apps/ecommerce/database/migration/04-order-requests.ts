import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceOrderRequestsMigration = defineDatabaseMigration({
  id: "ecommerce:order-requests:04-order-requests",
  appId: "ecommerce",
  moduleKey: "order-requests",
  name: "Create ecommerce order requests store",
  order: 40,
  async up({ database }) {
    await ensureJsonStoreTable(database, ecommerceTableNames.orderRequests)
  },
})
