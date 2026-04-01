import { frappePurchaseReceiptsMigration } from './018-frappe-purchase-receipts'
import { frappeItemProductSyncLogsMigration } from './019-frappe-item-product-sync-logs'
import { defineMigrationModule } from '../../migration'

export const frappeMigrationModule = defineMigrationModule('frappe', 'Frappe Integration', [
  frappePurchaseReceiptsMigration,
  frappeItemProductSyncLogsMigration,
])

