import type { HTMLAttributes } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusTone =
  | 'active'
  | 'inactive'
  | 'featured'
  | 'publishing'
  | 'promo'
  | 'home'
  | 'new'
  | 'best'
  | 'label'
  | 'system'
  | 'manual'
  | 'optimized'

const statusToneClasses: Record<StatusTone, string> = {
  active: 'border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100',
  inactive: 'border border-slate-300 bg-slate-200 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100',
  featured: 'border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100',
  publishing: 'border border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-100',
  promo: 'border border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800 dark:border-fuchsia-500/40 dark:bg-fuchsia-500/20 dark:text-fuchsia-100',
  home: 'border border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-100',
  new: 'border border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-100',
  best: 'border border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-100',
  label: 'border border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-100',
  system: 'border border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-100',
  manual: 'border border-zinc-300 bg-zinc-200 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100',
  optimized: 'border border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-500/40 dark:bg-teal-500/20 dark:text-teal-100',
}

interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  tone: StatusTone
}

export function StatusBadge({ tone, className, ...props }: StatusBadgeProps) {
  return <Badge className={cn(statusToneClasses[tone], className)} {...props} />
}

export function ActiveStatusBadge({
  isActive,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  className,
  ...props
}: Omit<StatusBadgeProps, 'tone'> & {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
}) {
  return (
    <StatusBadge tone={isActive ? 'active' : 'inactive'} className={className} {...props}>
      {isActive ? activeLabel : inactiveLabel}
    </StatusBadge>
  )
}
