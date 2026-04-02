import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { billingVouchers } from "../../src/data/billing-seed.js"

import { billingTableNames } from "../table-names.js"

export const billingVouchersSeeder = defineDatabaseSeeder({
  id: "billing:vouchers:03-vouchers",
  appId: "billing",
  moduleKey: "vouchers",
  name: "Seed billing vouchers",
  order: 30,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      billingTableNames.vouchers,
      billingVouchers.map((voucher, index) => ({
        id: voucher.id,
        moduleKey: "vouchers",
        sortOrder: index + 1,
        payload: voucher,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,
      }))
    )
  },
})
