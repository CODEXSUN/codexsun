import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { frappeTableNames } from "../table-names.js"

export const frappeSettingsMigration = defineDatabaseMigration({
  id: "frappe:settings:01-settings",
  appId: "frappe",
  moduleKey: "settings",
  name: "Create frappe settings table",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, frappeTableNames.settings)
  },
})
