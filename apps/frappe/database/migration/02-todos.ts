import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { frappeTableNames } from "../table-names.js"

export const frappeTodosMigration = defineDatabaseMigration({
  id: "frappe:todos:02-todos",
  appId: "frappe",
  moduleKey: "todos",
  name: "Create frappe todo table",
  order: 20,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, frappeTableNames.todos)
  },
})
