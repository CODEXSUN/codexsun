export interface BillingWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const billingWorkspaceItems: BillingWorkspaceItem[] = [
  {
    id: "categories",
    name: "Category",
    route: "/dashboard/billing/categories",
    summary: "Category masters used to organize ledger groups and accounting structure.",
  },
  {
    id: "chart-of-accounts",
    name: "Ledger",
    route: "/dashboard/billing/chart-of-accounts",
    summary: "Ledger masters with category mapping, subgroup structure, and closing balances.",
  },
  {
    id: "voucher-groups",
    name: "Voucher Group",
    route: "/dashboard/billing/voucher-groups",
    summary: "Voucher group masters that map operational lanes like sales and purchase into billing setup.",
  },
  {
    id: "voucher-types",
    name: "Voucher Type",
    route: "/dashboard/billing/voucher-types",
    summary: "Voucher type masters such as fabric sales and garment purchase mapped under voucher groups.",
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
    id: "sales-return",
    name: "Sales Return",
    route: "/dashboard/billing/sales-return",
    summary: "Sales return workspace for customer returns linked back to original invoices.",
  },
  {
    id: "debit-note",
    name: "Debit Note",
    route: "/dashboard/billing/debit-note",
    summary: "Debit note workspace for purchase returns and supplier adjustments.",
  },
  {
    id: "purchase-return",
    name: "Purchase Return",
    route: "/dashboard/billing/purchase-return",
    summary: "Purchase return workspace for supplier return documents linked back to original bills.",
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
    id: "gst-sales-register",
    name: "GST Sales Register",
    route: "/dashboard/billing/gst-sales-register",
    summary: "Posted GST sales and credit-note register for outward tax reporting and review.",
  },
  {
    id: "gst-purchase-register",
    name: "GST Purchase Register",
    route: "/dashboard/billing/gst-purchase-register",
    summary: "Posted GST purchase and debit-note register for input-tax reporting and review.",
  },
  {
    id: "input-output-tax-summary",
    name: "Input vs Output Tax",
    route: "/dashboard/billing/input-output-tax-summary",
    summary: "Net GST control summary comparing output liability against input credit.",
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
    id: "bank-book",
    name: "Bank Book",
    route: "/dashboard/billing/bank-book",
    summary: "Bank-ledger running book for posted receipts, payments, contra, and bank-linked movements.",
  },
  {
    id: "cash-book",
    name: "Cash Book",
    route: "/dashboard/billing/cash-book",
    summary: "Cash-ledger running book for posted cash receipts, cash payments, and contra-linked movements.",
  },
  {
    id: "bank-reconciliation",
    name: "Bank Reconciliation",
    route: "/dashboard/billing/bank-reconciliation",
    summary: "Pending bank-entry reconciliation queue prepared for statement matching and clearance workflow.",
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
  {
    id: "support-ledger-guide",
    name: "Ledger Guide",
    route: "/dashboard/billing/support/ledger-guide",
    summary: "Usage guide for setting up categories, ledgers, voucher groups, and voucher types in the right accounting order.",
  },
]
