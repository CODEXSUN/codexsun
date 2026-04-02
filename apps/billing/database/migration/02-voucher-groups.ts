import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

export const billingVoucherGroupsMigration = defineDatabaseMigration({
  id: "billing:voucher-groups:02-voucher-groups",
  appId: "billing",
  moduleKey: "voucher-groups",
  name: "Create billing voucher group table",
  order: 25,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.voucherGroups)
  },
})
