import { billingLedgersMigration } from "./01-ledgers.js"
import { billingVouchersMigration } from "./02-vouchers.js"

export const billingDatabaseMigrations = [
  billingLedgersMigration,
  billingVouchersMigration,
]
