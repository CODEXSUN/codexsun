import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js";
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js";

import { zetroTableNames } from "../table-names.js";

export const zetroExternalIntegrationMigrations = defineDatabaseMigration({
  id: "zetro:external-integration:13-zetro-external-integration",
  appId: "zetro",
  moduleKey: "external-integration",
  name: "Create Zetro webhooks and external integration stores",
  order: 130,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.webhooks);
    await ensureJsonStoreTable(database, zetroTableNames.webhookDeliveries);
  },
});
