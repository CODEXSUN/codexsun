import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { zetroTableNames } from "../table-names.js"

export const zetroRunsMigration = defineDatabaseMigration({
  id: "zetro:runs:02-zetro-runs",
  appId: "zetro",
  moduleKey: "runs",
  name: "Create Zetro run stores",
  order: 20,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.runs)
    await ensureJsonStoreTable(database, zetroTableNames.runEvents)
  },
})
