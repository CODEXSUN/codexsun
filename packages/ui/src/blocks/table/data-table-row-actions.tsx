import type { ReactNode } from 'react'
import { Ellipsis } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@codexsun/ui/components/dropdown-menu'

export type DataTableRowAction = {
  disabled?: boolean
  icon?: ReactNode
  id: string
  label: string
  onSelect: () => void
  separatorBefore?: boolean
  tone?: 'default' | 'destructive'
}

export function DataTableRowActions({
  actions,
  label,
}: {
  actions: DataTableRowAction[]
  label: string
}) {
  if (!actions.length) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button aria-label={label} size="icon-sm" variant="outline" />}>
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {actions.map((action, index) => (
          <div key={action.id}>
            {action.separatorBefore && index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              disabled={action.disabled}
              onClick={action.onSelect}
              variant={action.tone}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
