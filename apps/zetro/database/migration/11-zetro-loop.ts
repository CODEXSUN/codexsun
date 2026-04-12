import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js";
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js";

import { zetroTableNames } from "../table-names.js";

export const zetroLoopMigrations = defineDatabaseMigration({
  id: "zetro:loop:11-zetro-loop",
  appId: "zetro",
  moduleKey: "loop",
  name: "Create Zetro loop states store",
  order: 110,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.loopStates);
  },
});
