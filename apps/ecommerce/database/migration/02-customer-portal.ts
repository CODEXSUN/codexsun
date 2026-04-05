import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceCustomerPortalMigration = defineDatabaseMigration({
  id: "ecommerce:customer-portal:02-customer-portal",
  appId: "ecommerce",
  moduleKey: "customer-portal",
  name: "Create ecommerce customer portal store",
  order: 20,
  async up({ database }) {
    await ensureJsonStoreTable(database, ecommerceTableNames.customerPortal)
  },
})
