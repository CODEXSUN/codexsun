import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { frappeItems } from "../../src/data/frappe-seed.js"

import { frappeTableNames } from "../table-names.js"

export const frappeProductsSeeder = defineDatabaseSeeder({
  id: "frappe:products:06-products",
  appId: "frappe",
  moduleKey: "products",
  name: "Seed frappe products",
  order: 60,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      frappeTableNames.products,
      frappeItems.map((item, index) => ({
        id: item.id,
        moduleKey: "products",
        sortOrder: index + 1,
        payload: item,
        updatedAt: item.modifiedAt,
      }))
    )
  },
})
