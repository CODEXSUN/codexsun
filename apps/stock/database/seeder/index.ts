import type { DatabaseProcessSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { stockLiveStockFromCoreProductsSeeder } from "./01-live-stock-from-core-products.js"

export const stockDatabaseSeeders: DatabaseProcessSeeder[] = [
  stockLiveStockFromCoreProductsSeeder,
]
