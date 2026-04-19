import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"

import { billingTableNames } from "../table-names.js"

export const billingStockAcceptanceVerificationsMigration = defineDatabaseMigration({
  id: "billing:stock:32-stock-acceptance-verifications",
  appId: "billing",
  moduleKey: "stock-acceptance-verifications",
  name: "Create billing stock acceptance verifications store",
  order: 320,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.stockAcceptanceVerifications)
  },
})
