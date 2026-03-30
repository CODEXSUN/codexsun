import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { coreTableNames } from "../table-names.js"

export const coreContactsMigration = defineDatabaseMigration({
  id: "core:contacts:03-contacts",
  appId: "core",
  moduleKey: "contacts",
  name: "Create core contact table",
  order: 30,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, coreTableNames.contacts)
  },
})
