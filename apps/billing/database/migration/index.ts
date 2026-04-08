import { billingCategoriesMigration } from "./01-categories.js"
import { billingLedgersMigration } from "./01-ledgers.js"
import { billingVoucherGroupsMigration } from "./02-voucher-groups.js"
import { billingVouchersMigration } from "./02-vouchers.js"
import { billingVoucherTypesMigration } from "./03-voucher-types.js"
import { billingVoucherHeadersMigration } from "./04-voucher-headers.js"
import { billingVoucherLinesMigration } from "./05-voucher-lines.js"
import { billingLedgerEntriesMigration } from "./06-ledger-entries.js"
import { billingAccountingControlsMigration } from "./07-accounting-controls.js"
// ── Split voucher-type detail tables ──────────────────────────────────────
import { billingSalesVouchersMigration } from "./08-sales-vouchers.js"
import { billingPurchaseVouchersMigration } from "./09-purchase-vouchers.js"
import { billingReceiptVouchersMigration } from "./10-receipt-vouchers.js"
import { billingPaymentVouchersMigration } from "./11-payment-vouchers.js"
import { billingJournalVouchersMigration } from "./12-journal-vouchers.js"
import { billingContraVouchersMigration } from "./13-contra-vouchers.js"
import { billingPettyCashVouchersMigration } from "./14-petty-cash-vouchers.js"
import { billingBankBookEntriesMigration } from "./15-bank-book-entries.js"
import { billingCashBookEntriesMigration } from "./16-cash-book-entries.js"

export const billingDatabaseMigrations = [
  // ── Foundation ────────────────────────────────────────────────────────────
  billingCategoriesMigration,
  billingLedgersMigration,
  billingVoucherGroupsMigration,
  billingVoucherTypesMigration,
  billingVouchersMigration,
  // ── Shared normalized tables ──────────────────────────────────────────────
  billingVoucherHeadersMigration,
  billingVoucherLinesMigration,
  billingLedgerEntriesMigration,
  billingAccountingControlsMigration,
  // ── Split voucher-type detail tables ─────────────────────────────────────
  billingSalesVouchersMigration,
  billingPurchaseVouchersMigration,
  billingReceiptVouchersMigration,
  billingPaymentVouchersMigration,
  billingJournalVouchersMigration,
  billingContraVouchersMigration,
  billingPettyCashVouchersMigration,
  billingBankBookEntriesMigration,
  billingCashBookEntriesMigration,
]
