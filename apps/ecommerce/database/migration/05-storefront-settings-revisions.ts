import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceStorefrontSettingsRevisionsMigration = defineDatabaseMigration({
  id: "ecommerce:storefront:05-storefront-settings-revisions",
  appId: "ecommerce",
  moduleKey: "storefront",
  name: "Create ecommerce storefront settings revision store",
  order: 50,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, ecommerceTableNames.storefrontSettingsRevisions)
  },
})
