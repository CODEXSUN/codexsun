import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceSettingsMigration = defineDatabaseMigration({
  id: "ecommerce:storefront:07-ecommerce-settings",
  appId: "ecommerce",
  moduleKey: "storefront",
  name: "Create ecommerce app settings store",
  order: 70,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, ecommerceTableNames.settings)
  },
})
