import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { zetroTableNames } from "../table-names.js"

export const zetroGuardrailsMigration = defineDatabaseMigration({
  id: "zetro:guardrails:04-zetro-guardrails",
  appId: "zetro",
  moduleKey: "guardrails",
  name: "Create Zetro guardrail store",
  order: 40,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, zetroTableNames.guardrails)
  },
})
