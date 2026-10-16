import type { ReactNode } from 'react'
import { Ellipsis } from 'lucide-react'
import { Button } from '../../components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu'

export type DataTableRowAction = {
  disabled?: boolean | undefined
  icon?: ReactNode | undefined
  id: string
  label: string
  onSelect: () => void
  separatorBefore?: boolean | undefined
  tone?: 'default' | 'destructive' | undefined
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
      <DropdownMenuTrigger asChild>
        <Button aria-label={label} size="icon-sm" variant="outline"><Ellipsis /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {actions.map((action, index) => (
          <div key={action.id}>
            {action.separatorBefore && index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              {...(action.disabled !== undefined ? { disabled: action.disabled } : {})}
              onClick={action.onSelect}
              {...(action.tone === "destructive" ? { className: "text-destructive focus:text-destructive" } : {})}
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
