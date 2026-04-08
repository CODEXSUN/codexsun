import type { BillingVoucherType } from "./schemas/accounting.js"

export interface BillingVoucherModule {
  id: BillingVoucherType
  name: string
  route: string
  summary: string
  workflowHint: string
  desktopIntent: string
}

export const billingVoucherModules: BillingVoucherModule[] = [
  {
    id: "payment",
    name: "Payment Vouchers",
    route: "/dashboard/billing/payment-vouchers",
    summary: "Outgoing settlements from cash or bank against suppliers, expenses, and adjustments.",
    workflowHint: "Credit cash or bank and debit the target liability or expense ledger.",
    desktopIntent: "Optimized for fast bank and cash payment entry with keyboard-first posting flow.",
  },
  {
    id: "receipt",
    name: "Receipt Vouchers",
    route: "/dashboard/billing/receipt-vouchers",
    summary: "Incoming collections against debtors, advances, and other receivable-led flows.",
    workflowHint: "Debit cash or bank and credit the debtor or source ledger being settled.",
    desktopIntent: "Supports cashier-style receipt entry and backoffice bank receipt review.",
  },
  {
    id: "sales",
    name: "Sales Vouchers",
    route: "/dashboard/billing/sales-vouchers",
    summary: "Revenue posting for credit and cash sales with ledger-first accounting control.",
    workflowHint: "Debit debtor or cash/bank and credit sales and related output ledgers.",
    desktopIntent: "Prepared for invoice-style desktop entry with item, tax, and narration expansion.",
  },
  {
    id: "credit_note",
    name: "Credit Notes",
    route: "/dashboard/billing/credit-note",
    summary: "Customer-facing reductions for sales returns, post-sale discounts, and receivable corrections.",
    workflowHint: "Credit the customer ledger and debit the correcting revenue or adjustment ledgers.",
    desktopIntent: "Prepared for fast note issuance and adjustment review from the accounting desk.",
  },
  {
    id: "sales_return",
    name: "Sales Returns",
    route: "/dashboard/billing/sales-return",
    summary: "Customer return documents tied back to original sales invoices with stock and tax correction posture.",
    workflowHint: "Credit the customer or return-clearing ledger and debit the reversing sales and tax ledgers.",
    desktopIntent: "Prepared for return authorization review and source-invoice traceability from the finance desk.",
  },
  {
    id: "purchase",
    name: "Purchase Vouchers",
    route: "/dashboard/billing/purchase-vouchers",
    summary: "Supplier bills, expense capture, and inventory-linked purchase accounting.",
    workflowHint: "Debit purchase or stock-linked ledgers and credit the supplier or payment source.",
    desktopIntent: "Prepared for purchase bill entry with stock, tax, and bill reference panels.",
  },
  {
    id: "purchase_return",
    name: "Purchase Returns",
    route: "/dashboard/billing/purchase-return",
    summary: "Supplier return documents tied back to original purchase bills with payable and tax reversal handling.",
    workflowHint: "Debit the supplier or recovery ledger and credit the reversing purchase and tax ledgers.",
    desktopIntent: "Prepared for supplier return issue and source-bill traceability from the finance desk.",
  },
  {
    id: "debit_note",
    name: "Debit Notes",
    route: "/dashboard/billing/debit-note",
    summary: "Supplier-facing upward or corrective adjustments for purchase returns, shortages, and payable-side corrections.",
    workflowHint: "Debit the supplier or recovery ledger and credit the correcting purchase or adjustment ledgers.",
    desktopIntent: "Prepared for quick supplier adjustment entry and debit-note review from the accounting desk.",
  },
  {
    id: "stock_adjustment",
    name: "Stock Adjustments",
    route: "/dashboard/billing/stock",
    summary: "Manual inventory correction documents for shortages, excess, and physical-count adjustments.",
    workflowHint: "Use balanced finance lines with stock rows to record quantity corrections against inventory control.",
    desktopIntent: "Prepared for warehouse correction review with finance-visible adjustment posting.",
  },
  {
    id: "landed_cost",
    name: "Landed Cost",
    route: "/dashboard/billing/stock",
    summary: "Cost capitalization documents that allocate freight, duties, and other procurement overhead into stock value.",
    workflowHint: "Debit inventory control and credit the landed-cost source while allocating value to stock rows.",
    desktopIntent: "Prepared for after-purchase cost capitalization from the finance and procurement desk.",
  },
  {
    id: "contra",
    name: "Contra Vouchers",
    route: "/dashboard/billing/contra-vouchers",
    summary: "Cash-to-bank and bank-to-bank transfers without revenue or expense impact.",
    workflowHint: "Move value strictly between cash and bank ledgers while keeping totals equal.",
    desktopIntent: "Prepared for quick internal fund transfer entry across cash and bank books.",
  },
  {
    id: "journal",
    name: "Journal Vouchers",
    route: "/dashboard/billing/journal-vouchers",
    summary: "Adjustments, accruals, reclassifications, and non-cash accounting corrections.",
    workflowHint: "Use manual debit and credit lines for pure accounting adjustments.",
    desktopIntent: "Prepared for accountant-style adjustment entry and month-end closing workflow.",
  },
]
