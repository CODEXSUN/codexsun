import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommercePricingSettingsMigration = defineDatabaseMigration({
  id: "ecommerce:pricing-settings:01-pricing-settings",
  appId: "ecommerce",
  moduleKey: "pricing-settings",
  name: "Create ecommerce pricing settings table",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, ecommerceTableNames.pricingSettings)
  },
})
