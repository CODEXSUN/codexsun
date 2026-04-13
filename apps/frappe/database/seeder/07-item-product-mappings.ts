import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { frappeItemProductMappings } from "../../src/data/frappe-seed.js"

import { frappeTableNames } from "../table-names.js"

export const frappeItemProductMappingsSeeder = defineDatabaseSeeder({
  id: "frappe:item-product-mappings:07-item-product-mappings",
  appId: "frappe",
  moduleKey: "item-product-mappings",
  name: "Seed frappe item product mappings",
  order: 70,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      frappeTableNames.itemProductMappings,
      frappeItemProductMappings.map((item, index) => ({
        id: item.id,
        moduleKey: "item-product-mappings",
        sortOrder: index + 1,
        payload: item,
        updatedAt: item.updatedAt,
      }))
    )
  },
})
