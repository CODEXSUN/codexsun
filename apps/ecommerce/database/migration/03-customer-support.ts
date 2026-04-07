import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceCustomerSupportMigration = defineDatabaseMigration({
  id: "ecommerce:customer-support:03-customer-support",
  appId: "ecommerce",
  moduleKey: "customer-support",
  name: "Create ecommerce customer support store",
  order: 30,
  async up({ database }) {
    await ensureJsonStoreTable(database, ecommerceTableNames.supportCases)
  },
})
