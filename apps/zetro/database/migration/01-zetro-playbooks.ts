import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { zetroTableNames } from "../table-names.js"

export const zetroPlaybooksMigration = defineDatabaseMigration({
  id: "zetro:playbooks:01-zetro-playbooks",
  appId: "zetro",
  moduleKey: "playbooks",
  name: "Create Zetro playbook stores",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.playbooks)
    await ensureJsonStoreTable(database, zetroTableNames.playbookPhases)
  },
})
