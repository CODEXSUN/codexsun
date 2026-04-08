import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceStorefrontSettingsDraftsMigration = defineDatabaseMigration({
  id: "ecommerce:storefront:06-storefront-settings-drafts",
  appId: "ecommerce",
  moduleKey: "storefront",
  name: "Create ecommerce storefront settings draft store",
  order: 60,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, ecommerceTableNames.storefrontSettingsDrafts)
  },
})
