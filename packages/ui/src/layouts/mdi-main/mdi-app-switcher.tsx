import { CheckIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@codexsun/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@codexsun/ui/components/popover'
import { cn } from '@codexsun/ui/lib/utils'
import { TopologyMarker } from '../../features/interface-topology'

import { mdiTopMenuButtonClassName } from './mdi-top-menu-control'
import { useMdiTopology } from './mdi-topology'
import type { MdiAppItem } from './mdi-types'

export function MdiAppSwitcher({ apps }: { apps: MdiAppItem[] }) {
  const [open, setOpen] = useState(false)
  const topology = useMdiTopology()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className={cn(mdiTopMenuButtonClassName, topology.highlightClassName('01.5.1'))}
            aria-label="Open applications"
            {...topology.regionProps('01.5.1')}
          />
        }
      >
        <DotGrid />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={9}
        className={cn('w-88 gap-3 rounded-3xl p-4', topology.highlightClassName('01.5.2'))}
        {...topology.regionProps('01.5.2')}
      >
        <TopologyMarker id="01.5.2" topology={topology} />
        <div className="flex items-center justify-between px-2">
          <h2 className="text-base font-semibold">Apps</h2>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close">
            <XIcon />
          </Button>
        </div>
        <div
          className={cn(
            'grid grid-cols-3 gap-x-3 gap-y-5 rounded-2xl border p-5',
            topology.highlightClassName('01.5.3'),
          )}
          {...topology.regionProps('01.5.3')}
        >
          {apps.map((app) => (
            <AppItem key={app.label} app={app} onClose={() => setOpen(false)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DotGrid() {
  return (
    <span className="grid size-4 grid-cols-3 place-items-center gap-px" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <span className="size-1 rounded-full bg-current" key={index} />
      ))}
    </span>
  )
}

function AppItem({ app, onClose }: { app: MdiAppItem; onClose: () => void }) {
  const Icon = app.icon
  const content = (
    <>
      <span
        className={cn(
          'relative grid size-11 place-items-center rounded-xl border bg-background shadow-sm',
          app.active && 'border-foreground/50 bg-muted',
        )}
      >
        <Icon className="size-5" />
        {app.active ? (
          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-foreground text-background">
            <CheckIcon className="size-2.5" />
          </span>
        ) : null}
      </span>
      <span className="text-sm font-medium">{app.label}</span>
    </>
  )
  const className =
    'flex min-w-0 flex-col items-center gap-2 rounded-xl p-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'
  const onClick = () => {
    app.onSelect?.()
    onClose()
  }

  return app.href ? (
    <a className={className} href={app.href} onClick={onClick}>
      {content}
    </a>
  ) : (
    <button className={className} type="button" onClick={onClick}>
      {content}
    </button>
  )
}
