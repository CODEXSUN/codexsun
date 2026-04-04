import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { products } from "../../src/data/product-seed.js"

import { coreTableNames } from "../table-names.js"

export const coreProductsSeeder = defineDatabaseSeeder({
  id: "core:products:08-products",
  appId: "core",
  moduleKey: "products",
  name: "Seed core products",
  order: 80,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      coreTableNames.products,
      products.map((product, index) => ({
        id: product.id,
        moduleKey: "products",
        sortOrder: index + 1,
        payload: product,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }))
    )
  },
})
