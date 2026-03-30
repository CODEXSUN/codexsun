import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceCustomersMigration = defineDatabaseMigration({
  id: "ecommerce:customers:05-customers",
  appId: "ecommerce",
  moduleKey: "customers",
  name: "Create ecommerce customer helpdesk table",
  order: 50,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, ecommerceTableNames.customerHelpdeskDetails)
  },
})
