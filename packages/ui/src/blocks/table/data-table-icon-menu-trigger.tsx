import type { ReactNode } from 'react'
import { Button } from '../../components/button'
import { DropdownMenuTrigger } from '../../components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/tooltip'

export function DataTableIconMenuTrigger({
  active = false,
  children,
  label,
}: {
  active?: boolean | undefined
  children: ReactNode
  label: string
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button aria-label={label} className="relative" size="icon-sm" variant="outline">
              {children}
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 size-1.5 rounded-full bg-primary"
                />
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
