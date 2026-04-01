import { storefrontTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const storefrontRazorpayPaymentsMigration: Migration = {
  id: '011-storefront-razorpay-payments',
  name: 'Storefront Razorpay payment tracking',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${storefrontTableNames.orders}
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'pending' AFTER payment_method,
        ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(32) NULL AFTER payment_status,
        ADD COLUMN IF NOT EXISTS payment_gateway_order_id VARCHAR(120) NULL AFTER payment_gateway,
        ADD COLUMN IF NOT EXISTS payment_gateway_payment_id VARCHAR(120) NULL AFTER payment_gateway_order_id,
        ADD COLUMN IF NOT EXISTS payment_gateway_signature VARCHAR(255) NULL AFTER payment_gateway_payment_id,
        ADD COLUMN IF NOT EXISTS payment_captured_at DATETIME NULL AFTER payment_gateway_signature
    `)
  },
}


