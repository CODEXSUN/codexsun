export const stockOperationsTableNames = {
  purchaseReceipts: "billing_purchase_receipts",
  goodsInwardNotes: "billing_goods_inward_notes",
  stockUnits: "billing_stock_units",
  stockBarcodeAliases: "billing_stock_barcode_aliases",
  stickerPrintBatches: "billing_sticker_print_batches",
  stockSaleAllocations: "billing_stock_sale_allocations",
  stockAcceptanceVerifications: "billing_stock_acceptance_verifications",
} as const

export const stockTableNames = {
  ...stockOperationsTableNames,
  liveBalances: "stock_live_balances",
  movementLedger: "stock_movement_ledger",
} as const
