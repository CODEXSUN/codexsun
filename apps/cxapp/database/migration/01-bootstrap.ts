import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/index.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { cxappTableNames } from "../table-names.js"

export const coreBootstrapMigration = defineDatabaseMigration({
  id: "cxapp:bootstrap:01-bootstrap",
  appId: "cxapp",
  moduleKey: "bootstrap",
  name: "Create cxapp bootstrap snapshot table",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, cxappTableNames.bootstrapSnapshots)
  },
})
