import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"

import { billingTableNames } from "../table-names.js"

export const billingStickerPrintBatchesMigration = defineDatabaseMigration({
  id: "billing:stock:30-sticker-print-batches",
  appId: "billing",
  moduleKey: "sticker-print-batches",
  name: "Create billing sticker print batches store",
  order: 300,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.stickerPrintBatches)
  },
})
