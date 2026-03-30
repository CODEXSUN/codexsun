import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { frappePurchaseReceipts } from "../../src/data/frappe-seed.js"

import { frappeTableNames } from "../table-names.js"

export const frappePurchaseReceiptsSeeder = defineDatabaseSeeder({
  id: "frappe:purchase-receipts:04-purchase-receipts",
  appId: "frappe",
  moduleKey: "purchase-receipts",
  name: "Seed frappe purchase receipts",
  order: 40,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      frappeTableNames.purchaseReceipts,
      frappePurchaseReceipts.map((item, index) => ({
        id: item.id,
        moduleKey: "purchase-receipts",
        sortOrder: index + 1,
        payload: item,
        updatedAt: item.modifiedAt,
      }))
    )
  },
})
