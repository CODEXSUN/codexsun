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
import { billingSalesItemVouchersMigration } from "./17-sales-item-vouchers.js"
import { billingPurchaseItemVouchersMigration } from "./18-purchase-item-vouchers.js"
import { billingReceiptItemVouchersMigration } from "./19-receipt-item-vouchers.js"
import { billingPaymentItemVouchersMigration } from "./20-payment-item-vouchers.js"
import { billingJournalItemVouchersMigration } from "./21-journal-item-vouchers.js"
import { billingContraItemVouchersMigration } from "./22-contra-item-vouchers.js"
import { billingBillReferencesMigration } from "./23-bill-references.js"
import { billingBillSettlementsMigration } from "./24-bill-settlements.js"
import { billingBillOverdueTrackingMigration } from "./25-bill-overdue-tracking.js"
import { billingPurchaseReceiptsMigration } from "./26-purchase-receipts.js"
import { billingGoodsInwardNotesMigration } from "./27-goods-inward-notes.js"
import { billingStockUnitsMigration } from "./28-stock-units.js"
import { billingStockBarcodeAliasesMigration } from "./29-stock-barcode-aliases.js"
import { billingStickerPrintBatchesMigration } from "./30-sticker-print-batches.js"
import { billingStockSaleAllocationsMigration } from "./31-stock-sale-allocations.js"

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
  billingSalesItemVouchersMigration,
  billingPurchaseItemVouchersMigration,
  billingReceiptItemVouchersMigration,
  billingPaymentItemVouchersMigration,
  billingJournalItemVouchersMigration,
  billingContraItemVouchersMigration,
  billingBillReferencesMigration,
  billingBillSettlementsMigration,
  billingBillOverdueTrackingMigration,
  billingPurchaseReceiptsMigration,
  billingGoodsInwardNotesMigration,
  billingStockUnitsMigration,
  billingStockBarcodeAliasesMigration,
  billingStickerPrintBatchesMigration,
  billingStockSaleAllocationsMigration,
]
