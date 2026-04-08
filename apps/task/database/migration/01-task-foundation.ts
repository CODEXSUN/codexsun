import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { taskTableNames } from "../table-names.js"

export const taskFoundationMigration = defineDatabaseMigration({
  id: "task:foundation:01-task-foundation",
  appId: "task",
  moduleKey: "foundation",
  name: "Create task foundation JSON stores",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, taskTableNames.boards)
    await ensureJsonStoreTable(database, taskTableNames.boardStages)
    await ensureJsonStoreTable(database, taskTableNames.labels)
    await ensureJsonStoreTable(database, taskTableNames.routines)
    await ensureJsonStoreTable(database, taskTableNames.templates)
    await ensureJsonStoreTable(database, taskTableNames.tasks)
  },
})
