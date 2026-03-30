import { frappeSettingsMigration } from "./01-settings.js"
import { frappeTodosMigration } from "./02-todos.js"
import { frappeItemsMigration } from "./03-items.js"
import { frappePurchaseReceiptsMigration } from "./04-purchase-receipts.js"
import { frappeItemProductSyncLogsMigration } from "./05-item-product-sync-logs.js"

export const frappeDatabaseMigrations = [
  frappeSettingsMigration,
  frappeTodosMigration,
  frappeItemsMigration,
  frappePurchaseReceiptsMigration,
  frappeItemProductSyncLogsMigration,
]
