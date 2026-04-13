import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"

import { billingTableNames } from "../table-names.js"

export const billingStockSaleAllocationsMigration = defineDatabaseMigration({
  id: "billing:stock:31-stock-sale-allocations",
  appId: "billing",
  moduleKey: "stock-sale-allocations",
  name: "Create billing stock sale allocations store",
  order: 310,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.stockSaleAllocations)
  },
})
