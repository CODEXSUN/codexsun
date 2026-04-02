import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { billingVoucherMasterTypes } from "../../src/data/billing-seed.js"

import { billingTableNames } from "../table-names.js"

export const billingVoucherTypesSeeder = defineDatabaseSeeder({
  id: "billing:voucher-types:03-voucher-types",
  appId: "billing",
  moduleKey: "voucher-types",
  name: "Seed billing voucher types",
  order: 40,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      billingTableNames.voucherTypes,
      billingVoucherMasterTypes.map((type, index) => ({
        id: type.id,
        moduleKey: "voucher-types",
        sortOrder: index + 1,
        payload: type,
      }))
    )
  },
})
