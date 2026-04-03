import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ActivityStatusTone = "active" | "inactive"

const activityStatusColorClasses: Record<ActivityStatusTone, string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  inactive:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300",
}

export function getActivityStatusColorClassName(tone: ActivityStatusTone) {
  return activityStatusColorClasses[tone]
}

export function getActivityStatusPanelClassName(tone: ActivityStatusTone) {
  return cn("border", activityStatusColorClasses[tone])
}

export function ActivityStatusBadge({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  className,
}: {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        getActivityStatusColorClassName(active ? "active" : "inactive"),
        className
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </Badge>
  )
}
