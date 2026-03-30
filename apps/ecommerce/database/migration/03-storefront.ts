import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceStorefrontMigration = defineDatabaseMigration({
  id: "ecommerce:storefront:03-storefront",
  appId: "ecommerce",
  moduleKey: "storefront",
  name: "Create ecommerce storefront catalog table",
  order: 30,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, ecommerceTableNames.storefrontCatalogs)
  },
})
