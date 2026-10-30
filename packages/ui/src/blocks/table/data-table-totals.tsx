import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type DataTableTotal = {
  label: string
  value: ReactNode
}

export function DataTableTotals({
  className,
  items,
}: {
  className?: string | undefined
  items: DataTableTotal[]
}) {
  return (
    <div
      className={cn(
        'grid gap-x-8 gap-y-2 rounded-md border bg-card px-4 py-3 text-sm shadow-sm sm:grid-cols-2 xl:grid-cols-4',
        className,
      )}
    >
      {items.map((item) => (
        <div className="flex items-center justify-between gap-4" key={item.label}>
          <span className="text-muted-foreground">{item.label}</span>
          <strong className="font-semibold tabular-nums text-foreground">{item.value}</strong>
        </div>
      ))}
    </div>
  )
}
