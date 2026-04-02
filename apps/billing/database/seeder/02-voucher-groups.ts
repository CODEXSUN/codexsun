import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { billingVoucherGroups, billingVoucherMasterTypes } from "../../src/data/billing-seed.js"

import { billingTableNames } from "../table-names.js"

export const billingVoucherGroupsSeeder = defineDatabaseSeeder({
  id: "billing:voucher-groups:02-voucher-groups",
  appId: "billing",
  moduleKey: "voucher-groups",
  name: "Seed billing voucher groups",
  order: 30,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      billingTableNames.voucherGroups,
      billingVoucherGroups.map((group, index) => ({
        id: group.id,
        moduleKey: "voucher-groups",
        sortOrder: index + 1,
        payload: {
          ...group,
          linkedVoucherTypeCount: billingVoucherMasterTypes.filter(
            (type) => type.voucherGroupId === group.id
          ).length,
        },
      }))
    )
  },
})
