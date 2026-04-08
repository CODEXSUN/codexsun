import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { defaultEcommerceSettings } from "../../src/data/ecommerce-settings-seed.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceSettingsSeeder = defineDatabaseSeeder({
  id: "ecommerce:storefront:02-ecommerce-settings",
  appId: "ecommerce",
  moduleKey: "storefront",
  name: "Seed ecommerce app settings",
  order: 20,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(database, ecommerceTableNames.settings, [
      {
        id: defaultEcommerceSettings.id,
        moduleKey: "ecommerce-settings",
        sortOrder: 1,
        payload: defaultEcommerceSettings,
        createdAt: defaultEcommerceSettings.createdAt,
        updatedAt: defaultEcommerceSettings.updatedAt,
      },
    ])
  },
})
