import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { storefrontCatalog } from "../../src/data/ecommerce-seed.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceStorefrontSeeder = defineDatabaseSeeder({
  id: "ecommerce:storefront:03-storefront",
  appId: "ecommerce",
  moduleKey: "storefront",
  name: "Seed ecommerce storefront catalog snapshot",
  order: 30,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(database, ecommerceTableNames.storefrontCatalogs, [
      {
        id: "storefront-catalog:default",
        moduleKey: "storefront",
        payload: storefrontCatalog,
      },
    ])
  },
})
