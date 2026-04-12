import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js";
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js";

import { zetroTableNames } from "../table-names.js";

export const zetroChatMigrations = defineDatabaseMigration({
  id: "zetro:chat:10-zetro-chat",
  appId: "zetro",
  moduleKey: "chat",
  name: "Create Zetro chat sessions and messages stores",
  order: 100,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.chatSessions);
    await ensureJsonStoreTable(database, zetroTableNames.chatMessages);
  },
});
