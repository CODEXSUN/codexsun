import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { coreTableNames } from "../table-names.js"

export const coreCommonModulesMigration = defineDatabaseMigration({
  id: "core:common-modules:04-common-modules",
  appId: "core",
  moduleKey: "common-modules",
  name: "Create common module metadata and item tables",
  order: 40,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, coreTableNames.commonModuleMetadata)
    await ensureJsonStoreTable(database, coreTableNames.commonModuleItems)
  },
})
