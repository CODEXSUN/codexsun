import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { billingCategories, billingLedgers } from "../../src/data/billing-seed.js"

import { billingTableNames } from "../table-names.js"

export const billingCategoriesSeeder = defineDatabaseSeeder({
  id: "billing:categories:01-categories",
  appId: "billing",
  moduleKey: "categories",
  name: "Seed billing categories",
  order: 10,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      billingTableNames.categories,
      billingCategories.map((category, index) => ({
        id: category.id,
        moduleKey: "categories",
        sortOrder: index + 1,
        payload: {
          ...category,
          linkedLedgerCount: billingLedgers.filter(
            (ledger) => ledger.categoryId === category.id
          ).length,
        },
      }))
    )
  },
})
