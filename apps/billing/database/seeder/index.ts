import { billingLedgersSeeder } from "./01-ledgers.js"
import { billingVouchersSeeder } from "./02-vouchers.js"

export const billingDatabaseSeeders = [
  billingLedgersSeeder,
  billingVouchersSeeder,
]
