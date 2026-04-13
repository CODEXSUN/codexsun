import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"

import { billingTableNames } from "../table-names.js"

export const billingGoodsInwardNotesMigration = defineDatabaseMigration({
  id: "billing:stock:27-goods-inward-notes",
  appId: "billing",
  moduleKey: "goods-inward-notes",
  name: "Create billing goods inward notes store",
  order: 270,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.goodsInwardNotes)
  },
})
