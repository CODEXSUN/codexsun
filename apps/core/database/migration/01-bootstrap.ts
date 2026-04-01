import { ensureJsonStoreTable } from "../../../framework/src/runtime/database"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { coreTableNames } from "../table-names.js"

export const coreBootstrapMigration = defineDatabaseMigration({
  id: "core:bootstrap:01-bootstrap",
  appId: "core",
  moduleKey: "bootstrap",
  name: "Create core bootstrap snapshot table",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, coreTableNames.bootstrapSnapshots)
  },
})
