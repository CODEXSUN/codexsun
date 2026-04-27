import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"

import { billingTableNames } from "../table-names.js"

export const billingDeliveryNotesMigration = defineDatabaseMigration({
  id: "billing:stock:33-delivery-notes",
  appId: "billing",
  moduleKey: "delivery-notes",
  name: "Create billing delivery notes store",
  order: 330,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.deliveryNotes)
  },
})
