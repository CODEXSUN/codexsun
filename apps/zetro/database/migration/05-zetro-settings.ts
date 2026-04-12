import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { zetroTableNames } from "../table-names.js"

export const zetroSettingsMigration = defineDatabaseMigration({
  id: "zetro:settings:05-zetro-settings",
  appId: "zetro",
  moduleKey: "settings",
  name: "Create Zetro settings store",
  order: 50,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.settings)
  },
})
