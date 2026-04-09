import type {
  BillingVoucher,
  BillingVoucherLifecycleStatus,
  BillingVoucherType,
} from "@billing/shared"

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount)
}

export function titleFromVoucherType(type: BillingVoucherType) {
  switch (type) {
    case "payment":
      return "Payment"
    case "receipt":
      return "Receipt"
    case "sales":
      return "Sales"
    case "sales_return":
      return "Sales Return"
    case "credit_note":
      return "Credit Note"
    case "purchase":
      return "Purchase"
    case "purchase_return":
      return "Purchase Return"
    case "debit_note":
      return "Debit Note"
    case "stock_adjustment":
      return "Stock Adjustment"
    case "landed_cost":
      return "Landed Cost"
    case "contra":
      return "Contra"
    case "journal":
      return "Journal"
    default:
      return type
  }
}

export function getVoucherTotals(voucher: Pick<BillingVoucher, "lines">) {
  return voucher.lines.reduce(
    (totals, line) => {
      if (line.side === "debit") {
        totals.debit += line.amount
      } else {
        totals.credit += line.amount
      }
      return totals
    },
    { debit: 0, credit: 0 }
  )
}

export function isVoucherBalanced(voucher: Pick<BillingVoucher, "lines">) {
  const totals = getVoucherTotals(voucher)
  return Math.abs(totals.debit - totals.credit) < 0.001
}

export function toStatusLabel(status: BillingVoucher["eInvoice"]["status"]) {
  switch (status) {
    case "generated":
      return "Generated"
    case "pending":
      return "Pending"
    case "failed":
      return "Failed"
    default:
      return "Not required"
  }
}

export function toVoucherLifecycleLabel(status: BillingVoucherLifecycleStatus) {
  switch (status) {
    case "draft":
      return "Draft"
    case "posted":
      return "Posted"
    case "cancelled":
      return "Cancelled"
    case "reversed":
      return "Reversed"
  }
}

export function getVoucherLifecycleBadgeVariant(status: BillingVoucherLifecycleStatus) {
  switch (status) {
    case "draft":
      return "secondary" as const
    case "posted":
      return "outline" as const
    case "cancelled":
    case "reversed":
      return "destructive" as const
  }
}

export function getVoucherPostingRoute(voucherType: BillingVoucherType, voucherId: string) {
  const encodedVoucherId = encodeURIComponent(voucherId)

  switch (voucherType) {
    case "payment":
      return `/dashboard/billing/payment-vouchers/${encodedVoucherId}/edit`
    case "receipt":
      return `/dashboard/billing/receipt-vouchers/${encodedVoucherId}/edit`
    case "sales":
      return `/dashboard/billing/sales-vouchers/${encodedVoucherId}/edit`
    case "sales_return":
      return `/dashboard/billing/sales-return/${encodedVoucherId}/edit`
    case "credit_note":
      return `/dashboard/billing/credit-note/${encodedVoucherId}/edit`
    case "purchase":
      return `/dashboard/billing/purchase-vouchers/${encodedVoucherId}/edit`
    case "purchase_return":
      return `/dashboard/billing/purchase-return/${encodedVoucherId}/edit`
    case "debit_note":
      return `/dashboard/billing/debit-note/${encodedVoucherId}/edit`
    case "stock_adjustment":
    case "landed_cost":
      return `/dashboard/billing/voucher-register`
    default:
      return null
  }
}
