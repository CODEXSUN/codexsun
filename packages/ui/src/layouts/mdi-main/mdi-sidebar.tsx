import { PlusIcon, Settings2Icon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@codexsun/ui/components/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@codexsun/ui/components/sidebar'
import { cn } from '@codexsun/ui/lib/utils'
import { TopologyMarker, TopologyRegion } from '../../features/interface-topology'

import { NavigationSection } from './mdi-sidebar-navigation'
import type { MdiNavigationSection, MdiPrimaryAction } from './mdi-types'
import { useMdiTopology } from './mdi-topology'
import { usePersistentScrollPosition } from './use-mdi-sidebar-state'

type MdiSidebarProps = {
  navigation: MdiNavigationSection[]
  onOpenFeatures: () => void
  primaryAction?: MdiPrimaryAction | null
  sidebarContent?: ReactNode
  sidebarContentClassName?: string
  sidebarFooter?: ReactNode | null
  sidebarFooterClassName?: string
  stateKey?: string
}

export function MdiSidebar({
  navigation,
  onOpenFeatures,
  primaryAction,
  sidebarContent,
  sidebarContentClassName,
  sidebarFooter,
  sidebarFooterClassName,
  stateKey,
}: MdiSidebarProps) {
  const topology = useMdiTopology()
  const PrimaryActionIcon = primaryAction?.icon ?? PlusIcon
  const scrollPosition = usePersistentScrollPosition(
    stateKey ? `${stateKey}:scroll-position` : undefined,
  )

  return (
    <Sidebar
      className="absolute h-full data-[ito-highlighted=true]:ring-2 data-[ito-highlighted=true]:ring-inset data-[ito-highlighted=true]:ring-violet-700"
      collapsible="offcanvas"
      {...topology.regionProps('02')}
    >
      <TopologyMarker id="02" topology={topology} />
      <SidebarContent
        className={cn('scrollbar-gutter-stable pt-0', sidebarContentClassName)}
        {...scrollPosition}
      >
        {sidebarContent !== undefined ? (
          sidebarContent
        ) : (
          <>
            {primaryAction ? (
              <TopologyRegion as={SidebarGroup} className="px-3 pt-3" id="02.2" topology={topology}>
                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={primaryAction.onSelect}
                >
                  <PrimaryActionIcon />
                  {primaryAction.label}
                </Button>
              </TopologyRegion>
            ) : null}
            <TopologyRegion as="div" className="min-h-0 flex-1" id="02.3" topology={topology}>
              {navigation.map((section, index) => (
                <NavigationSection
                  key={section.label ?? index}
                  section={section}
                  stateKey={stateKey ? `${stateKey}:section:${section.label ?? index}` : undefined}
                />
              ))}
            </TopologyRegion>
          </>
        )}
      </SidebarContent>
      {sidebarFooter === undefined ? (
        <TopologyRegion
          as={SidebarFooter}
          className={cn('border-t p-3', sidebarFooterClassName)}
          id="02.4"
          topology={topology}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<button type="button" />} onClick={onOpenFeatures}>
                <Settings2Icon />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </TopologyRegion>
      ) : sidebarFooter === null ? null : (
        <SidebarFooter className={cn('border-t p-3', sidebarFooterClassName)}>
          {sidebarFooter}
        </SidebarFooter>
      )}
      <TopologyRegion
        as="div"
        className="pointer-events-none absolute inset-y-0 right-0 w-4 [&>[data-ito-marker]]:left-auto [&>[data-ito-marker]]:right-2 [&>[data-ito-marker]]:top-20"
        id="02.5"
        topology={topology}
      >
        <SidebarRail className="pointer-events-auto" />
      </TopologyRegion>
    </Sidebar>
  )
}
