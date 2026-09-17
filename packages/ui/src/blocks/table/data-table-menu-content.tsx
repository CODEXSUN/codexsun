import type { ReactNode } from 'react'
import { DropdownMenuContent } from '@codexsun/ui/components/dropdown-menu'

export function DataTableMenuContent({
  actionLabel,
  children,
  onAction,
  title,
}: {
  actionLabel: string
  children: ReactNode
  onAction: () => void
  title: string
}) {
  return (
    <DropdownMenuContent align="end" className="w-56 p-0">
      <div className="flex items-center justify-between gap-4 border-b px-3 py-2.5">
        <span className="text-sm font-medium">{title}</span>
        <button
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
      <div className="grid gap-1 p-2">{children}</div>
    </DropdownMenuContent>
  )
}

export const dataTableMenuOptionClass = 'min-h-10 py-2.5 pl-3'
