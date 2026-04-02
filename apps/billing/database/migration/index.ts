import { billingCategoriesMigration } from "./01-categories.js"
import { billingLedgersMigration } from "./01-ledgers.js"
import { billingVoucherGroupsMigration } from "./02-voucher-groups.js"
import { billingVoucherTypesMigration } from "./03-voucher-types.js"
import { billingVouchersMigration } from "./02-vouchers.js"

export const billingDatabaseMigrations = [
  billingCategoriesMigration,
  billingLedgersMigration,
  billingVoucherGroupsMigration,
  billingVoucherTypesMigration,
  billingVouchersMigration,
]
