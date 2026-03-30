import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { frappeItems } from "../../src/data/frappe-seed.js"

import { frappeTableNames } from "../table-names.js"

export const frappeItemsSeeder = defineDatabaseSeeder({
  id: "frappe:items:03-items",
  appId: "frappe",
  moduleKey: "items",
  name: "Seed frappe items",
  order: 30,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      frappeTableNames.items,
      frappeItems.map((item, index) => ({
        id: item.id,
        moduleKey: "items",
        sortOrder: index + 1,
        payload: item,
        updatedAt: item.modifiedAt,
      }))
    )
  },
})
