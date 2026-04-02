import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

export const billingVoucherTypesMigration = defineDatabaseMigration({
  id: "billing:voucher-types:03-voucher-types",
  appId: "billing",
  moduleKey: "voucher-types",
  name: "Create billing voucher type table",
  order: 26,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.voucherTypes)
  },
})
