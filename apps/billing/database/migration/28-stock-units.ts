import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"

import { billingTableNames } from "../table-names.js"

export const billingStockUnitsMigration = defineDatabaseMigration({
  id: "billing:stock:28-stock-units",
  appId: "billing",
  moduleKey: "stock-units",
  name: "Create billing stock units store",
  order: 280,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.stockUnits)
  },
})
