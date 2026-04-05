import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { defaultStorefrontSettings } from "../../src/data/storefront-seed.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceStorefrontSettingsSeeder = defineDatabaseSeeder({
  id: "ecommerce:storefront:01-storefront-settings",
  appId: "ecommerce",
  moduleKey: "storefront",
  name: "Seed ecommerce storefront settings",
  order: 10,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(database, ecommerceTableNames.storefrontSettings, [
      {
        id: defaultStorefrontSettings.id,
        moduleKey: "storefront-settings",
        sortOrder: 1,
        payload: defaultStorefrontSettings,
        createdAt: defaultStorefrontSettings.createdAt,
        updatedAt: defaultStorefrontSettings.updatedAt,
      },
    ])
  },
})
