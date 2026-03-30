import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { customerHelpdeskDetails } from "../../src/data/ecommerce-seed.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceCustomersSeeder = defineDatabaseSeeder({
  id: "ecommerce:customers:05-customers",
  appId: "ecommerce",
  moduleKey: "customers",
  name: "Seed ecommerce customer helpdesk details",
  order: 50,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      ecommerceTableNames.customerHelpdeskDetails,
      customerHelpdeskDetails.map((detail, index) => ({
        id: detail.customer.id,
        moduleKey: "customers",
        sortOrder: index + 1,
        payload: detail,
      }))
    )
  },
})
