import { storefrontTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const storefrontOrdersMigration: Migration = {
  id: '009-storefront-orders',
  name: 'Storefront checkout orders',
  async up({ db }) {
    const execute = db.execute.bind(db)

    await execute(`
      CREATE TABLE IF NOT EXISTS ${storefrontTableNames.orders} (
        id VARCHAR(64) PRIMARY KEY,
        order_number VARCHAR(40) NOT NULL UNIQUE,
        status VARCHAR(32) NOT NULL DEFAULT 'placed',
        first_name VARCHAR(120) NOT NULL,
        last_name VARCHAR(120) NOT NULL,
        email VARCHAR(180) NOT NULL,
        phone VARCHAR(40) NOT NULL,
        address_line1 VARCHAR(200) NOT NULL,
        address_line2 VARCHAR(200) NULL,
        city VARCHAR(120) NOT NULL,
        state_name VARCHAR(120) NOT NULL,
        country_name VARCHAR(120) NOT NULL,
        postal_code VARCHAR(32) NOT NULL,
        customer_note TEXT NULL,
        delivery_method VARCHAR(32) NOT NULL,
        payment_method VARCHAR(32) NOT NULL,
        subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
        shipping_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        handling_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        currency_code VARCHAR(12) NOT NULL DEFAULT 'INR',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await execute(`
      CREATE TABLE IF NOT EXISTS ${storefrontTableNames.orderItems} (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        product_name VARCHAR(180) NOT NULL,
        product_slug VARCHAR(180) NOT NULL,
        sku VARCHAR(120) NOT NULL,
        size_value VARCHAR(80) NOT NULL,
        color_value VARCHAR(80) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
        line_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_storefront_order_items_order
          FOREIGN KEY (order_id) REFERENCES ${storefrontTableNames.orders}(id),
        INDEX idx_storefront_order_items_order (order_id),
        INDEX idx_storefront_order_items_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  },
}


