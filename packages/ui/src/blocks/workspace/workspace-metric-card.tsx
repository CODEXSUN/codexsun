import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, type LucideIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'

import { Card, CardContent, CardHeader } from '../../components/card'
import { cn } from '../../lib/utils'

export type WorkspaceMetricTone = 'accent' | 'danger' | 'neutral' | 'success' | 'warning'
export type WorkspaceMetricTrend = {
  direction: 'down' | 'flat' | 'up'
  label: string
}

type WorkspaceMetricCardProps = {
  description?: ReactNode
  icon?: LucideIcon
  label: ReactNode
  tone?: WorkspaceMetricTone
  trend?: WorkspaceMetricTrend
  value: ReactNode
}

const iconToneClasses: Record<WorkspaceMetricTone, string> = {
  accent: 'bg-primary/10 text-primary',
  danger: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning-foreground',
}

const trendIcons: Record<WorkspaceMetricTrend['direction'], LucideIcon> = {
  down: ArrowDownRightIcon,
  flat: ArrowRightIcon,
  up: ArrowUpRightIcon,
}

const trendClasses: Record<WorkspaceMetricTrend['direction'], string> = {
  down: 'text-destructive',
  flat: 'text-muted-foreground',
  up: 'text-success',
}

export function WorkspaceMetricCard({
  description,
  icon: Icon,
  label,
  tone = 'neutral',
  trend,
  value,
}: WorkspaceMetricCardProps) {
  const TrendIcon = trend ? trendIcons[trend.direction] : null

  return (
    <Card className="min-w-0 shadow-xs" size="sm">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0 text-sm font-medium text-muted-foreground">{label}</div>
        {Icon ? (
          <span
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-lg',
              iconToneClasses[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-2">
        <strong className="text-2xl font-semibold tracking-tight tabular-nums">{value}</strong>
        <div className="flex min-h-5 items-center gap-2 text-xs">
          {trend && TrendIcon ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                trendClasses[trend.direction],
              )}
            >
              <TrendIcon className="size-3.5" />
              {trend.label}
            </span>
          ) : null}
          {description ? (
            <span className="truncate text-muted-foreground">{description}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkspaceMetricGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)} {...props} />
}
