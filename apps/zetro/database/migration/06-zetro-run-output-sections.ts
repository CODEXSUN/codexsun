import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js";
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js";

import { zetroTableNames } from "../table-names.js";

export const zetroRunOutputSectionsMigration = defineDatabaseMigration({
  id: "zetro:run-output-sections:06-zetro-run-output-sections",
  appId: "zetro",
  moduleKey: "run-output-sections",
  name: "Create Zetro run output sections store",
  order: 60,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.runOutputSections);
  },
});
