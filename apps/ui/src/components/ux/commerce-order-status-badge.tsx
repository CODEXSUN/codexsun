import { Badge } from "@/components/ui/badge"

type CommerceOrderStatusBadgeProps = {
  status: string
}

const statusLabelMap: Record<string, string> = {
  created: "Created",
  payment_pending: "Payment Pending",
  paid: "Paid",
  fulfilment_pending: "Fulfilment Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

const statusClassMap: Record<string, string> = {
  created: "border-slate-500/25 bg-slate-500/10 text-slate-700",
  payment_pending: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  paid: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  fulfilment_pending: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700",
  shipped: "border-violet-500/30 bg-violet-500/10 text-violet-700",
  delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
  refunded: "border-rose-500/30 bg-rose-500/10 text-rose-700",
}

export function CommerceOrderStatusBadge({
  status,
}: CommerceOrderStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={statusClassMap[status] ?? "border-border/70 bg-background"}
    >
      {statusLabelMap[status] ?? status}
    </Badge>
  )
}
