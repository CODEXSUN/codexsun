import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function BillingVoucherSectionPage({
  sectionId,
}: {
  sectionId:
    | "chart-of-accounts"
    | "voucher-register"
    | "payment-vouchers"
    | "receipt-vouchers"
    | "sales-vouchers"
    | "purchase-vouchers"
    | "contra-vouchers"
    | "journal-vouchers"
    | "day-book"
    | "double-entry"
    | "trial-balance"
    | "profit-and-loss"
    | "balance-sheet"
    | "bill-outstanding"
}) {
  return <FrameworkAppWorkspacePage appId="billing" sectionId={sectionId} />
}
