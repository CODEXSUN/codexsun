import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"

import { billingTableNames } from "../table-names.js"

export const billingPurchaseReceiptsMigration = defineDatabaseMigration({
  id: "billing:stock:26-purchase-receipts",
  appId: "billing",
  moduleKey: "purchase-receipts",
  name: "Create billing purchase receipts store",
  order: 260,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.purchaseReceipts)
  },
})
