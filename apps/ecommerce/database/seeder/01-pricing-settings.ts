import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { ecommercePricingSettings } from "../../src/data/ecommerce-seed.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommercePricingSettingsSeeder = defineDatabaseSeeder({
  id: "ecommerce:pricing-settings:01-pricing-settings",
  appId: "ecommerce",
  moduleKey: "pricing-settings",
  name: "Seed ecommerce pricing settings",
  order: 10,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(database, ecommerceTableNames.pricingSettings, [
      {
        id: "pricing-settings:default",
        moduleKey: "pricing-settings",
        payload: ecommercePricingSettings,
      },
    ])
  },
})
