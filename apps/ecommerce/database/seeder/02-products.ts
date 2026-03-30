import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { products } from "../../src/data/ecommerce-seed.js"

import { ecommerceTableNames } from "../table-names.js"

export const ecommerceProductsSeeder = defineDatabaseSeeder({
  id: "ecommerce:products:02-products",
  appId: "ecommerce",
  moduleKey: "products",
  name: "Seed ecommerce products",
  order: 20,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      ecommerceTableNames.products,
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
