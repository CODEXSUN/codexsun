import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { coreTableNames } from "../table-names.js"

export const coreCompaniesMigration = defineDatabaseMigration({
  id: "core:companies:02-companies",
  appId: "core",
  moduleKey: "companies",
  name: "Create core company table",
  order: 20,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, coreTableNames.companies)
  },
})
