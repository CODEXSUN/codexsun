export interface BillingWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const billingWorkspaceItems: BillingWorkspaceItem[] = [
  {
    id: "overview",
    name: "Accounts Overview",
    route: "/dashboard/billing",
    summary: "Tally-style accounting overview with books, voucher mix, and period balance health.",
  },
  {
    id: "chart-of-accounts",
    name: "Chart Of Accounts",
    route: "/dashboard/billing/chart-of-accounts",
    summary: "Primary ledgers, groups, and balance positions used for double-entry posting.",
  },
  {
    id: "sales-vouchers",
    name: "Sales",
    route: "/dashboard/billing/sales-vouchers",
    summary: "Sales voucher workspace with GST-aware posting and receivable impact.",
  },
  {
    id: "purchase-vouchers",
    name: "Purchase",
    route: "/dashboard/billing/purchase-vouchers",
    summary: "Purchase voucher workspace with GST-aware posting and payable impact.",
  },
  {
    id: "payment-vouchers",
    name: "Payment",
    route: "/dashboard/billing/payment-vouchers",
    summary: "Outgoing payment vouchers with bill settlement and bank/cash impact.",
  },
  {
    id: "receipt-vouchers",
    name: "Receipt",
    route: "/dashboard/billing/receipt-vouchers",
    summary: "Incoming receipt vouchers with bill settlement and collection tracking.",
  },
  {
    id: "journal-vouchers",
    name: "Journal",
    route: "/dashboard/billing/journal-vouchers",
    summary: "Adjustment journals for accruals, transfers, and month-end corrections.",
  },
  {
    id: "contra-vouchers",
    name: "Contra",
    route: "/dashboard/billing/contra-vouchers",
    summary: "Cash-bank and bank-bank transfer vouchers with double-entry checks.",
  },
  {
    id: "credit-note",
    name: "Credit Note",
    route: "/dashboard/billing/credit-note",
    summary: "Credit note workspace for sales returns, discounts, and customer adjustments.",
  },
  {
    id: "debit-note",
    name: "Debit Note",
    route: "/dashboard/billing/debit-note",
    summary: "Debit note workspace for purchase returns and supplier adjustments.",
  },
  {
    id: "stock",
    name: "Stock",
    route: "/dashboard/billing/stock",
    summary: "Inventory-focused page for stock position, item movement, and valuation hooks.",
  },
  {
    id: "statements",
    name: "Statements",
    route: "/dashboard/billing/statements",
    summary: "Party and book statements derived from posted vouchers and running balances.",
  },
  {
    id: "voucher-register",
    name: "Voucher Register",
    route: "/dashboard/billing/voucher-register",
    summary: "Payment, receipt, sales, purchase, contra, and journal vouchers in one register.",
  },
  {
    id: "day-book",
    name: "Day Book",
    route: "/dashboard/billing/day-book",
    summary: "Chronological posting view for all voucher activity across the active books.",
  },
  {
    id: "double-entry",
    name: "Double Entry",
    route: "/dashboard/billing/double-entry",
    summary: "Per-voucher debit and credit inspection with balancing checks and posting notes.",
  },
  {
    id: "trial-balance",
    name: "Trial Balance",
    route: "/dashboard/billing/trial-balance",
    summary: "Ledger-wise opening, movement, and closing balance view derived from posted books.",
  },
  {
    id: "profit-and-loss",
    name: "P & L",
    route: "/dashboard/billing/profit-and-loss",
    summary: "Income and expense statement generated from the current posted accounting books.",
  },
  {
    id: "balance-sheet",
    name: "Balance Sheet",
    route: "/dashboard/billing/balance-sheet",
    summary: "Assets and liabilities view with current period earnings carried into the books.",
  },
  {
    id: "bill-outstanding",
    name: "Bill Outstanding",
    route: "/dashboard/billing/bill-outstanding",
    summary: "Receivable and payable bills with bill-wise settlement impact from receipts and payments.",
  },
]
