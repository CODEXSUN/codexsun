import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { zetroTableNames } from "../table-names.js"

export const zetroFindingsMigration = defineDatabaseMigration({
  id: "zetro:findings:03-zetro-findings",
  appId: "zetro",
  moduleKey: "findings",
  name: "Create Zetro finding store",
  order: 30,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.findings)
  },
})
