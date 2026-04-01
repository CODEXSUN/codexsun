import { frappeTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const frappeItemProductSyncLogsMigration: Migration = {
  id: '019-frappe-item-product-sync-logs',
  name: 'Frappe item to product sync logs',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${frappeTableNames.itemProductSyncLogs} (
        id VARCHAR(64) PRIMARY KEY,
        duplicate_mode VARCHAR(16) NOT NULL,
        requested_count INT NOT NULL DEFAULT 0,
        success_count INT NOT NULL DEFAULT 0,
        skipped_count INT NOT NULL DEFAULT 0,
        failure_count INT NOT NULL DEFAULT 0,
        started_at DATETIME NOT NULL,
        finished_at DATETIME NOT NULL,
        synced_at DATETIME NOT NULL,
        created_by_user_id VARCHAR(64) NULL,
        summary TEXT NOT NULL,
        items_json JSON NOT NULL,
        failure_json JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_frappe_item_product_sync_logs_synced_at (synced_at),
        INDEX idx_frappe_item_product_sync_logs_created_by (created_by_user_id),
        INDEX idx_frappe_item_product_sync_logs_mode (duplicate_mode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  },
}


