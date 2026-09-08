import { CheckCircle2, Minus, XCircle } from 'lucide-react'
import { cn } from '@codexsun/ui/lib/utils'

export type DataTableStatusTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning'

const toneClasses: Record<DataTableStatusTone, string> = {
  danger:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
  neutral: 'border-border bg-muted/50 text-muted-foreground',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
}

export function DataTableStatus({
  className,
  label,
  showIcon = true,
  tone = 'neutral',
}: {
  className?: string
  label: string
  showIcon?: boolean
  tone?: DataTableStatusTone
}) {
  const Icon = tone === 'danger' ? XCircle : tone === 'neutral' ? Minus : CheckCircle2

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {showIcon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {label}
    </span>
  )
}
