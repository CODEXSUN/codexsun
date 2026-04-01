import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

export const billingLedgersMigration = defineDatabaseMigration({
  id: "billing:ledgers:01-ledgers",
  appId: "billing",
  moduleKey: "ledgers",
  name: "Create billing ledger table",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.ledgers)
  },
})
