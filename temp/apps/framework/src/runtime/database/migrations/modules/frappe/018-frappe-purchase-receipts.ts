import { frappeTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const frappePurchaseReceiptsMigration: Migration = {
  id: '018-frappe-purchase-receipts',
  name: 'Frappe purchase receipt sync',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${frappeTableNames.purchaseReceipts} (
        id VARCHAR(64) PRIMARY KEY,
        frappe_receipt_id VARCHAR(140) NOT NULL UNIQUE,
        supplier VARCHAR(160) NOT NULL,
        supplier_name VARCHAR(200) NOT NULL,
        company VARCHAR(160) NOT NULL,
        warehouse VARCHAR(160) NOT NULL,
        bill_no VARCHAR(160) NOT NULL,
        currency VARCHAR(32) NOT NULL,
        posting_date DATE NULL,
        posting_time VARCHAR(32) NOT NULL,
        status VARCHAR(64) NOT NULL,
        is_return TINYINT(1) NOT NULL DEFAULT 0,
        grand_total DECIMAL(14,2) NOT NULL DEFAULT 0,
        rounded_total DECIMAL(14,2) NOT NULL DEFAULT 0,
        item_count INT NOT NULL DEFAULT 0,
        product_count INT NOT NULL DEFAULT 0,
        source_modified_at VARCHAR(64) NOT NULL,
        synced_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_frappe_purchase_receipts_supplier (supplier),
        INDEX idx_frappe_purchase_receipts_company (company),
        INDEX idx_frappe_purchase_receipts_status (status),
        INDEX idx_frappe_purchase_receipts_posting_date (posting_date),
        INDEX idx_frappe_purchase_receipts_synced_at (synced_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${frappeTableNames.purchaseReceiptItems} (
        id VARCHAR(64) PRIMARY KEY,
        receipt_id VARCHAR(64) NOT NULL,
        frappe_row_id VARCHAR(140) NOT NULL,
        item_code VARCHAR(140) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        warehouse VARCHAR(160) NOT NULL,
        uom VARCHAR(64) NOT NULL,
        stock_uom VARCHAR(64) NOT NULL,
        quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
        received_quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
        rejected_quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
        rate DECIMAL(14,2) NOT NULL DEFAULT 0,
        amount DECIMAL(14,2) NOT NULL DEFAULT 0,
        product_id VARCHAR(64) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_frappe_purchase_receipt_items_receipt FOREIGN KEY (receipt_id) REFERENCES ${frappeTableNames.purchaseReceipts}(id) ON DELETE CASCADE,
        INDEX idx_frappe_purchase_receipt_items_receipt (receipt_id),
        INDEX idx_frappe_purchase_receipt_items_code (item_code),
        INDEX idx_frappe_purchase_receipt_items_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  },
}


