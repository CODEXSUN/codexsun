import { CheckIcon, Grid3X3Icon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@codexsun/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@codexsun/ui/components/popover'
import { cn } from '@codexsun/ui/lib/utils'

import type { MdiAppItem } from './mdi-types'

export function MdiAppSwitcher({ apps }: { apps: MdiAppItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-full bg-background shadow-sm"
            aria-label="Open applications"
          />
        }
      >
        <Grid3X3Icon className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={9} className="w-[352px] gap-3 rounded-3xl p-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-base font-semibold">Apps</h2>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close">
            <XIcon />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 rounded-2xl border p-5">
          {apps.map((app) => (
            <AppItem key={app.label} app={app} onClose={() => setOpen(false)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
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
