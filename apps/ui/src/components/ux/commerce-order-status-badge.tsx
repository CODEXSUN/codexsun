import { Badge } from "@/components/ui/badge"

type CommerceOrderStatusBadgeProps = {
  status: string
}

const statusLabelMap: Record<string, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const statusClassMap: Record<string, string> = {
  pending_payment: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  confirmed: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  processing: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700",
  shipped: "border-violet-500/30 bg-violet-500/10 text-violet-700",
  delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
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
