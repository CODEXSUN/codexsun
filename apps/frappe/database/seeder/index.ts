import { frappeSettingsSeeder } from "./01-settings.js"
import { frappeTodosSeeder } from "./02-todos.js"
import { frappeItemsSeeder } from "./03-items.js"
import { frappePurchaseReceiptsSeeder } from "./04-purchase-receipts.js"
import { frappeItemProductSyncLogsSeeder } from "./05-item-product-sync-logs.js"
import { frappeProductsSeeder } from "./06-products.js"
import { frappeItemProductMappingsSeeder } from "./07-item-product-mappings.js"

export const frappeDatabaseSeeders = [
  frappeSettingsSeeder,
  frappeTodosSeeder,
  frappeItemsSeeder,
  frappePurchaseReceiptsSeeder,
  frappeItemProductSyncLogsSeeder,
  frappeProductsSeeder,
  frappeItemProductMappingsSeeder,
]
