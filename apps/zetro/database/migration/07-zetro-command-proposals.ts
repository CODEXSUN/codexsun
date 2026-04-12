import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js";
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js";

import { zetroTableNames } from "../table-names.js";

export const zetroCommandProposalsMigration = defineDatabaseMigration({
  id: "zetro:command-proposals:07-zetro-command-proposals",
  appId: "zetro",
  moduleKey: "command-proposals",
  name: "Create Zetro command proposals store",
  order: 70,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.commandProposals);
  },
});
