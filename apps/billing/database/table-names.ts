export const billingTableNames = {
  // ── Foundation JSON stores ────────────────────────────────────────────────
  categories: "billing_categories",
  ledgers: "billing_ledgers",
  voucherGroups: "billing_voucher_groups",
  voucherTypes: "billing_voucher_types",

  // ── Raw JSON voucher store (master / source-of-truth) ─────────────────────
  vouchers: "billing_vouchers",

  // ── Shared normalized tables ──────────────────────────────────────────────
  voucherHeaders: "billing_voucher_headers",
  voucherLines: "billing_voucher_lines",
  ledgerEntries: "billing_ledger_entries",
  yearCloseWorkflows: "billing_year_close_workflows",
  openingBalanceRollovers: "billing_opening_balance_rollovers",
  yearEndControls: "billing_year_end_controls",
  purchaseReceipts: "billing_purchase_receipts",
  goodsInwardNotes: "billing_goods_inward_notes",
  stockUnits: "billing_stock_units",
  stockBarcodeAliases: "billing_stock_barcode_aliases",
  stickerPrintBatches: "billing_sticker_print_batches",
  stockSaleAllocations: "billing_stock_sale_allocations",

  // ── Split voucher-type detail tables (reference billing_voucher_headers) ──
  salesVouchers: "billing_sales_vouchers",
  purchaseVouchers: "billing_purchase_vouchers",
  receiptVouchers: "billing_receipt_vouchers",
  paymentVouchers: "billing_payment_vouchers",
  journalVouchers: "billing_journal_vouchers",
  contraVouchers: "billing_contra_vouchers",
  pettyCashVouchers: "billing_petty_cash_vouchers",
  bankBookEntries: "billing_bank_book_entries",
  cashBookEntries: "billing_cash_book_entries",
  salesItemVouchers: "billing_sales_item_vouchers",
  purchaseItemVouchers: "billing_purchase_item_vouchers",
  receiptItemVouchers: "billing_receipt_item_vouchers",
  paymentItemVouchers: "billing_payment_item_vouchers",
  journalItemVouchers: "billing_journal_item_vouchers",
  contraItemVouchers: "billing_contra_item_vouchers",
  billReferences: "billing_bill_references",
  billSettlements: "billing_bill_settlements",
  billOverdueTracking: "billing_bill_overdue_tracking",
} as const
