import { MenuIcon, type LucideIcon } from 'lucide-react'

import { Button } from '@codexsun/ui/components/button'
import { useSidebar } from '@codexsun/ui/components/sidebar'
import { TopologyMarker, TopologyRegion } from '../../features/interface-topology'

import { MdiAppSwitcher } from './mdi-app-switcher'
import { MdiGlobalSearch } from './mdi-global-search'
import { MdiNotificationsMenu } from './mdi-notifications-menu'
import { MdiProfileMenu } from './mdi-profile-menu'
import { useMdiTopology } from './mdi-topology'
import type {
  MdiAppItem,
  MdiFeatures,
  MdiNavigationSection,
  MdiNotification,
  MdiUser,
} from './mdi-types'

type MdiTopMenuProps = {
  applicationIcon: LucideIcon
  applicationName: string
  apps: MdiAppItem[]
  features: MdiFeatures
  notificationCount: number
  notifications: readonly MdiNotification[]
  navigation: MdiNavigationSection[]
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
  notifications,
  navigation,
  searchPlaceholder,
  searchValue,
  user,
  onSearchChange,
}: MdiTopMenuProps) {
  const { toggleSidebar } = useSidebar()
  const topology = useMdiTopology()

  return (
    <header
      className="relative flex h-14 shrink-0 items-center border-t-4 border-t-emerald-50 border-b border-b-border bg-background shadow-sm data-[ito-highlighted=true]:ring-2 data-[ito-highlighted=true]:ring-inset data-[ito-highlighted=true]:ring-violet-700"
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
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <TopologyRegion as="div" id="01.3" topology={topology}>
            <MdiGlobalSearch
              applicationName={applicationName}
              apps={apps}
              navigation={navigation}
              onSearchChange={onSearchChange}
              placeholder={searchPlaceholder}
              value={searchValue}
            />
          </TopologyRegion>
          {features.notifications ? (
            <TopologyRegion as="div" id="01.4" topology={topology}>
              <MdiNotificationsMenu count={notificationCount} notifications={notifications} />
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
