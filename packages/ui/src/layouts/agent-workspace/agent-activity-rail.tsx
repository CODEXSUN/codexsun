import { cn } from '@codexsun/ui/lib/utils'
import { Button } from '@codexsun/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@codexsun/ui/components/tooltip'

import type { AgentWorkspaceRail, AgentWorkspaceRailItem } from './agent-workspace.types'

type AgentActivityRailProps = {
  rail: AgentWorkspaceRail
  side: 'left' | 'right'
  visible: boolean
}

export function AgentActivityRail({ rail, side, visible }: AgentActivityRailProps) {
  return (
    <TooltipProvider>
      <aside
        aria-hidden={!visible}
        aria-label={rail.label}
        className={cn(
          'relative z-20 h-full shrink-0 overflow-hidden bg-sidebar transition-[width,opacity,border-color] duration-200 motion-reduce:transition-none',
          visible
            ? cn('w-14 border-border opacity-100', side === 'left' ? 'border-r' : 'border-l')
            : 'pointer-events-none w-0 border-0 opacity-0',
        )}
      >
        {visible ? (
          <div className="flex h-full w-14 flex-col items-center gap-2 px-2 py-3">
            <RailItems items={rail.items} side={side} />
            {rail.footerItems?.length ? (
              <div className="flex min-h-0 flex-1 flex-col justify-end">
                <RailItems items={rail.footerItems} side={side} />
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </TooltipProvider>
  )
}

function RailItems({
  items,
  side,
}: {
  items: readonly AgentWorkspaceRailItem[]
  side: 'left' | 'right'
}) {
  return (
    <nav
      className="flex flex-col gap-2"
      aria-label={side === 'left' ? 'Primary tools' : 'Secondary tools'}
    >
      {items.map((item) => (
        <RailAction item={item} key={item.id} side={side} />
      ))}
    </nav>
  )
}

function RailAction({ item, side }: { item: AgentWorkspaceRailItem; side: 'left' | 'right' }) {
  const Icon = item.icon

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
            className={cn(
              'relative hover:translate-y-0 active:translate-y-0 motion-reduce:transition-none',
              item.active &&
                'bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-border before:absolute before:inset-y-2 before:-left-1.5 before:w-0.5 before:rounded-full before:bg-primary hover:bg-sidebar-accent',
            )}
            disabled={item.disabled}
            size="icon"
            variant={item.active ? 'secondary' : 'ghost'}
            onClick={item.onSelect}
          />
        }
      >
        <Icon />
        {item.badge !== undefined ? <RailBadge value={item.badge} /> : null}
      </TooltipTrigger>
      <TooltipContent side={side === 'left' ? 'right' : 'left'}>{item.label}</TooltipContent>
    </Tooltip>
  )
}

function RailBadge({ value }: { value: number | string }) {
  return (
    <span className="absolute top-0.5 right-0.5 grid min-h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground">
      {value}
    </span>
  )
}
