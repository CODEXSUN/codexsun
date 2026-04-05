import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceStorefrontFoundationMigration = defineDatabaseMigration({
  id: "ecommerce:storefront:01-storefront-foundation",
  appId: "ecommerce",
  moduleKey: "storefront",
  name: "Create ecommerce storefront, customer, and order stores",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, ecommerceTableNames.storefrontSettings)
    await ensureJsonStoreTable(database, ecommerceTableNames.customerAccounts)
    await ensureJsonStoreTable(database, ecommerceTableNames.orders)
  },
})
