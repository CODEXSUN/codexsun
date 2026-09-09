import { SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@codexsun/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@codexsun/ui/components/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@codexsun/ui/components/dialog'
import { Kbd } from '@codexsun/ui/components/kbd'
import { cn } from '@codexsun/ui/lib/utils'
import { TopologyMarker } from '../../features/interface-topology'

import { mdiTopMenuSurfaceClassName } from './mdi-top-menu-control'
import { useMdiTopology } from './mdi-topology'
import type { MdiAppItem, MdiNavigationItem, MdiNavigationSection } from './mdi-types'

type MdiGlobalSearchProps = {
  applicationName: string
  apps: MdiAppItem[]
  navigation: MdiNavigationSection[]
  placeholder: string
  value?: string
  onSearchChange?: (value: string) => void
}

export function MdiGlobalSearch({
  applicationName,
  apps,
  navigation,
  placeholder,
  value,
  onSearchChange,
}: MdiGlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const topology = useMdiTopology()

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (!event.ctrlKey || event.key.toLowerCase() !== 'k') return
      event.preventDefault()
      setOpen((current) => !current)
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  return (
    <>
      <Button
        aria-keyshortcuts="Control+K"
        aria-label="Open global search"
        className={cn(
          mdiTopMenuSurfaceClassName,
          'h-9 gap-2 rounded-full px-2.5 text-sm font-medium sm:px-3',
          topology.highlightClassName('01.3.1'),
        )}
        onClick={() => setOpen(true)}
        variant="outline"
        {...topology.regionProps('01.3.1')}
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <Kbd className="hidden bg-muted-foreground/10 text-xs sm:inline-flex">Ctrl K</Kbd>
      </Button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent
          className={cn(
            'top-[14%] translate-y-0 overflow-hidden rounded-2xl! p-0 shadow-2xl sm:max-w-3xl',
            topology.highlightClassName('01.3.2'),
          )}
          showCloseButton={false}
          {...topology.regionProps('01.3.2')}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Global search</DialogTitle>
            <DialogDescription>
              Search {applicationName} and open workspace destinations.
            </DialogDescription>
          </DialogHeader>
          <TopologyMarker id="01.3.2" topology={topology} />
          <Command>
            <div
              className={topology.highlightClassName('01.3.3')}
              {...topology.regionProps('01.3.3')}
            >
              <CommandInput
                autoFocus
                onValueChange={onSearchChange}
                placeholder={placeholder}
                value={value}
              />
            </div>
            <CommandList
              className={topology.highlightClassName('01.3.4')}
              {...topology.regionProps('01.3.4')}
            >
              <CommandEmpty>
                {onSearchChange
                  ? `Search results for ${applicationName} are updating in the workspace.`
                  : 'No matching destination.'}
              </CommandEmpty>
              <NavigationGroup navigation={navigation} onClose={() => setOpen(false)} />
              <ApplicationGroup apps={apps} onClose={() => setOpen(false)} />
            </CommandList>
            <div className="flex items-center justify-end gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
              <span>Close</span>
              <Kbd>Esc</Kbd>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}

function NavigationGroup({
  navigation,
  onClose,
}: {
  navigation: MdiNavigationSection[]
  onClose: () => void
}) {
  const items = navigation.flatMap((section) => getNavigationLeaves(section.items))
  if (items.length === 0) return null

  return (
    <CommandGroup heading="Current workspace">
      {items.map((item) => (
        <DestinationItem item={item} key={`${item.label}-${item.href ?? ''}`} onClose={onClose} />
      ))}
    </CommandGroup>
  )
}

function getNavigationLeaves(items: MdiNavigationItem[]): MdiNavigationItem[] {
  return items.flatMap((item) => {
    const children = item.children ?? []
    return children.length > 0 ? getNavigationLeaves(children) : [item]
  })
}

function ApplicationGroup({ apps, onClose }: { apps: MdiAppItem[]; onClose: () => void }) {
  return (
    <CommandGroup heading="Applications">
      {apps.map((app) => {
        const Icon = app.icon
        return (
          <CommandItem
            key={app.label}
            onSelect={() => activateDestination(app, onClose)}
            value={app.label}
          >
            <Icon />
            <span>{app.label}</span>
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function DestinationItem({ item, onClose }: { item: MdiNavigationItem; onClose: () => void }) {
  const Icon = item.icon
  return (
    <CommandItem onSelect={() => activateDestination(item, onClose)} value={item.label}>
      {Icon ? <Icon /> : <span className="size-4" />}
      <span>{item.label}</span>
    </CommandItem>
  )
}

function activateDestination(
  destination: Pick<MdiAppItem, 'href' | 'onSelect'>,
  onClose: () => void,
) {
  destination.onSelect?.()
  if (destination.href) window.location.assign(destination.href)
  onClose()
}
