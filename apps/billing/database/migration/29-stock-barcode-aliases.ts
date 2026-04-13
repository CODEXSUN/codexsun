import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"

import { billingTableNames } from "../table-names.js"

export const billingStockBarcodeAliasesMigration = defineDatabaseMigration({
  id: "billing:stock:29-stock-barcode-aliases",
  appId: "billing",
  moduleKey: "stock-barcode-aliases",
  name: "Create billing stock barcode aliases store",
  order: 290,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.stockBarcodeAliases)
  },
})
