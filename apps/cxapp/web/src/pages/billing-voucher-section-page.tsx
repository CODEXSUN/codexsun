import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function BillingVoucherSectionPage({
  sectionId,
}: {
  sectionId:
    | "categories"
    | "categories-upsert"
    | "chart-of-accounts"
    | "voucher-groups"
    | "voucher-types"
    | "voucher-register"
    | "payment-vouchers"
    | "payment-vouchers-upsert"
    | "receipt-vouchers"
    | "receipt-vouchers-upsert"
    | "sales-vouchers"
    | "sales-vouchers-upsert"
    | "purchase-vouchers"
    | "purchase-vouchers-upsert"
    | "credit-note-upsert"
    | "debit-note-upsert"
    | "contra-vouchers"
    | "journal-vouchers"
    | "credit-note"
    | "debit-note"
    | "stock"
    | "statements"
    | "day-book"
    | "double-entry"
    | "bank-book"
    | "cash-book"
    | "bank-reconciliation"
    | "general-ledger"
    | "trial-balance"
    | "profit-and-loss"
    | "balance-sheet"
    | "bill-outstanding"
    | "support-ledger-guide"
}) {
  return <FrameworkAppWorkspacePage appId="billing" sectionId={sectionId} />
}
