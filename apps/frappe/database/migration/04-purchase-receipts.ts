import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { frappeTableNames } from "../table-names.js"

export const frappePurchaseReceiptsMigration = defineDatabaseMigration({
  id: "frappe:purchase-receipts:04-purchase-receipts",
  appId: "frappe",
  moduleKey: "purchase-receipts",
  name: "Create frappe purchase receipt table",
  order: 40,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, frappeTableNames.purchaseReceipts)
  },
})
