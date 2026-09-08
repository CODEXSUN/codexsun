import type { ReactNode } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { DropdownMenuTrigger } from '@codexsun/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@codexsun/ui/components/tooltip'

export function DataTableIconMenuTrigger({
  active = false,
  children,
  label,
}: {
  active?: boolean
  children: ReactNode
  label: string
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenuTrigger
          render={
            <TooltipTrigger
              render={
                <Button aria-label={label} className="relative" size="icon-sm" variant="outline" />
              }
            >
              {children}
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 size-1.5 rounded-full bg-primary"
                />
              ) : null}
            </TooltipTrigger>
          }
        />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
