import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js";
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js";

import { zetroTableNames } from "../table-names.js";

export const zetroExecutedCommandsMigration = defineDatabaseMigration({
  id: "zetro:executed-commands:09-zetro-executed-commands",
  appId: "zetro",
  moduleKey: "executed-commands",
  name: "Create Zetro executed commands store",
  order: 90,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.executedCommands);
  },
});
