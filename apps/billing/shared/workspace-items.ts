import { billingVoucherModules } from "./voucher-modules.js"

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
    id: "voucher-register",
    name: "Voucher Register",
    route: "/dashboard/billing/voucher-register",
    summary: "Payment, receipt, sales, purchase, contra, and journal vouchers in one register.",
  },
  ...billingVoucherModules.map((module) => ({
    id: `${module.id}-vouchers`,
    name: module.name,
    route: module.route,
    summary: module.summary,
  })),
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
    name: "Profit & Loss",
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
