import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js";
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js";

import { zetroTableNames } from "../table-names.js";

export const zetroMemoryMigrations = defineDatabaseMigration({
  id: "zetro:memory:12-zetro-memory",
  appId: "zetro",
  moduleKey: "memory",
  name: "Create Zetro memory vectors store",
  order: 120,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.memoryVectors);
  },
});
