import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { frappeTodos } from "../../src/data/frappe-seed.js"

import { frappeTableNames } from "../table-names.js"

export const frappeTodosSeeder = defineDatabaseSeeder({
  id: "frappe:todos:02-todos",
  appId: "frappe",
  moduleKey: "todos",
  name: "Seed frappe todos",
  order: 20,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      frappeTableNames.todos,
      frappeTodos.map((item, index) => ({
        id: item.id,
        moduleKey: "todos",
        sortOrder: index + 1,
        payload: item,
        updatedAt: item.modifiedAt,
      }))
    )
  },
})
