import { billingCategoriesMigration } from "./01-categories.js"
import { billingLedgersMigration } from "./01-ledgers.js"
import { billingVoucherGroupsMigration } from "./02-voucher-groups.js"
import { billingVoucherTypesMigration } from "./03-voucher-types.js"
import { billingVouchersMigration } from "./02-vouchers.js"
import { billingVoucherHeadersMigration } from "./04-voucher-headers.js"
import { billingVoucherLinesMigration } from "./05-voucher-lines.js"
import { billingLedgerEntriesMigration } from "./06-ledger-entries.js"

export const billingDatabaseMigrations = [
  billingCategoriesMigration,
  billingLedgersMigration,
  billingVoucherGroupsMigration,
  billingVoucherTypesMigration,
  billingVouchersMigration,
  billingVoucherHeadersMigration,
  billingVoucherLinesMigration,
  billingLedgerEntriesMigration,
]
