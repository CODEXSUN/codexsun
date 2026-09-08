import { BellIcon, MenuIcon, SearchIcon, type LucideIcon } from 'lucide-react'

import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { useSidebar } from '@codexsun/ui/components/sidebar'
import { TopologyMarker, TopologyRegion } from '../../features/interface-topology'

import { MdiAppSwitcher } from './mdi-app-switcher'
import { MdiProfileMenu } from './mdi-profile-menu'
import { useMdiTopology } from './mdi-topology'
import type { MdiAppItem, MdiFeatures, MdiUser } from './mdi-types'

type MdiTopMenuProps = {
  applicationIcon: LucideIcon
  applicationName: string
  apps: MdiAppItem[]
  features: MdiFeatures
  notificationCount: number
  searchPlaceholder: string
  searchValue?: string
  user: MdiUser
  onSearchChange?: (value: string) => void
}

export function MdiTopMenu({
  applicationIcon: ApplicationIcon,
  applicationName,
  apps,
  features,
  notificationCount,
  searchPlaceholder,
  searchValue,
  user,
  onSearchChange,
}: MdiTopMenuProps) {
  const { toggleSidebar } = useSidebar()
  const topology = useMdiTopology()

  return (
    <header
      className="relative flex h-14 shrink-0 items-center border-t-4 border-t-emerald-50 border-b bg-background shadow-xs data-[ito-highlighted=true]:shadow-[inset_0_0_0_2px_rgb(126_34_206/0.92)]"
      {...topology.regionProps('01')}
    >
      <TopologyMarker id="01" topology={topology} />
      <TopologyRegion
        as="div"
        className="grid h-full w-14 shrink-0 place-items-center border-r"
        id="01.1"
        topology={topology}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label="Toggle application navigation"
        >
          <MenuIcon />
        </Button>
      </TopologyRegion>
      <div className="flex min-w-0 flex-1 items-center gap-5 px-5">
        <TopologyRegion
          as="div"
          className="flex w-24 shrink-0 items-center gap-2 text-sm font-semibold"
          id="01.2"
          topology={topology}
        >
          <ApplicationIcon className="size-4" />
          <span className="truncate">{applicationName}</span>
        </TopologyRegion>
        <TopologyRegion
          as="label"
          className="relative hidden w-full max-w-3xl md:block"
          id="01.3"
          topology={topology}
        >
          <span className="sr-only">Search {applicationName}</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            className="h-10 rounded-full border-0 bg-muted/70 pl-11 shadow-none focus-visible:bg-background"
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </TopologyRegion>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {features.notifications ? (
            <TopologyRegion as="div" id="01.4" topology={topology}>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                aria-label="Notifications"
              >
                <BellIcon className="size-4" />
                {notificationCount > 0 ? (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-background bg-red-500" />
                ) : null}
              </Button>
            </TopologyRegion>
          ) : null}
          {features.appSwitcher ? (
            <TopologyRegion as="div" id="01.5" topology={topology}>
              <MdiAppSwitcher apps={apps} />
            </TopologyRegion>
          ) : null}
          {features.profileMenu ? (
            <TopologyRegion as="div" id="01.6" topology={topology}>
              <MdiProfileMenu user={user} />
            </TopologyRegion>
          ) : null}
        </div>
      </div>
    </header>
  )
}
