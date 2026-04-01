import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

export const billingVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:02-vouchers",
  appId: "billing",
  moduleKey: "vouchers",
  name: "Create billing voucher table",
  order: 20,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.vouchers)
  },
})
