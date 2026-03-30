import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { orderWorkflows } from "../../src/data/ecommerce-seed.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceOrdersSeeder = defineDatabaseSeeder({
  id: "ecommerce:orders:04-orders",
  appId: "ecommerce",
  moduleKey: "orders",
  name: "Seed ecommerce order workflows",
  order: 40,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      ecommerceTableNames.orderWorkflows,
      orderWorkflows.map((workflow, index) => ({
        id: workflow.order.id,
        moduleKey: "orders",
        sortOrder: index + 1,
        payload: workflow,
        createdAt: workflow.order.createdAt,
        updatedAt: workflow.order.updatedAt,
      }))
    )
  },
})
