import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/index.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { cxappTableNames } from "../table-names.js"

export const coreCompaniesMigration = defineDatabaseMigration({
  id: "cxapp:companies:02-companies",
  appId: "cxapp",
  moduleKey: "companies",
  name: "Create cxapp company table",
  order: 20,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, cxappTableNames.companies)
  },
})
