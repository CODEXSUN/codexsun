import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js";
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js";

import { zetroTableNames } from "../table-names.js";

export const zetroCommandAllowlistMigration = defineDatabaseMigration({
  id: "zetro:command-allowlist:08-zetro-command-allowlist",
  appId: "zetro",
  moduleKey: "command-allowlist",
  name: "Create Zetro command allowlist store",
  order: 80,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.commandAllowlist);
  },
});
