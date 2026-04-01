import { commerceTableNames, storefrontTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const commerceOperationsMigration: Migration = {
  id: '016-commerce-operations',
  name: 'Commerce operations',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commerceTableNames.orderEvents} (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        title VARCHAR(160) NOT NULL,
        description TEXT NULL,
        status_after VARCHAR(64) NOT NULL,
        metadata_json JSON NULL,
        occurred_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_storefront_order_events_order FOREIGN KEY (order_id) REFERENCES ${storefrontTableNames.orders}(id),
        INDEX idx_storefront_order_events_order (order_id),
        INDEX idx_storefront_order_events_type (event_type),
        INDEX idx_storefront_order_events_time (occurred_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commerceTableNames.shipments} (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        shipment_number VARCHAR(64) NOT NULL UNIQUE,
        status VARCHAR(64) NOT NULL,
        courier_name VARCHAR(120) NULL,
        courier_service VARCHAR(120) NULL,
        tracking_number VARCHAR(120) NULL,
        tracking_url VARCHAR(255) NULL,
        pickup_requested_at DATETIME NULL,
        picked_up_at DATETIME NULL,
        estimated_delivery_at DATETIME NULL,
        delivered_at DATETIME NULL,
        delivery_confirmed_at DATETIME NULL,
        notes TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_storefront_shipments_order FOREIGN KEY (order_id) REFERENCES ${storefrontTableNames.orders}(id),
        INDEX idx_storefront_shipments_order (order_id),
        INDEX idx_storefront_shipments_tracking_number (tracking_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commerceTableNames.shipmentEvents} (
        id VARCHAR(64) PRIMARY KEY,
        shipment_id VARCHAR(64) NOT NULL,
        order_id VARCHAR(64) NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        title VARCHAR(160) NOT NULL,
        description TEXT NULL,
        location_name VARCHAR(160) NULL,
        event_time DATETIME NOT NULL,
        metadata_json JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_storefront_shipment_events_shipment FOREIGN KEY (shipment_id) REFERENCES ${commerceTableNames.shipments}(id),
        CONSTRAINT fk_storefront_shipment_events_order FOREIGN KEY (order_id) REFERENCES ${storefrontTableNames.orders}(id),
        INDEX idx_storefront_shipment_events_shipment (shipment_id),
        INDEX idx_storefront_shipment_events_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commerceTableNames.invoices} (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL UNIQUE,
        invoice_number VARCHAR(64) NOT NULL UNIQUE,
        status VARCHAR(32) NOT NULL,
        issue_date DATETIME NOT NULL,
        due_date DATETIME NULL,
        subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
        shipping_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        handling_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        currency_code VARCHAR(16) NOT NULL,
        payment_status VARCHAR(32) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_sales_invoices_order FOREIGN KEY (order_id) REFERENCES ${storefrontTableNames.orders}(id),
        INDEX idx_sales_invoices_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commerceTableNames.invoiceItems} (
        id VARCHAR(64) PRIMARY KEY,
        invoice_id VARCHAR(64) NOT NULL,
        order_item_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
        unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
        line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_sales_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES ${commerceTableNames.invoices}(id),
        INDEX idx_sales_invoice_items_invoice (invoice_id),
        INDEX idx_sales_invoice_items_order_item (order_item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commerceTableNames.vouchers} (
        id VARCHAR(64) PRIMARY KEY,
        source_type VARCHAR(64) NOT NULL,
        source_id VARCHAR(64) NOT NULL,
        voucher_type VARCHAR(64) NOT NULL,
        voucher_number VARCHAR(64) NOT NULL UNIQUE,
        posting_date DATETIME NOT NULL,
        effective_date DATETIME NOT NULL,
        memo TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_accounting_vouchers_source (source_type, source_id),
        INDEX idx_accounting_vouchers_type (voucher_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commerceTableNames.voucherLines} (
        id VARCHAR(64) PRIMARY KEY,
        voucher_id VARCHAR(64) NOT NULL,
        ledger_code VARCHAR(64) NOT NULL,
        ledger_name VARCHAR(160) NOT NULL,
        debit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        credit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        narration VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_accounting_voucher_lines_voucher FOREIGN KEY (voucher_id) REFERENCES ${commerceTableNames.vouchers}(id),
        INDEX idx_accounting_voucher_lines_voucher (voucher_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  },
}


