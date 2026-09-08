import { ChevronRightIcon, LayoutDashboardIcon, PlusIcon, Settings2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@codexsun/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@codexsun/ui/components/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@codexsun/ui/components/sidebar'
import { cn } from '@codexsun/ui/lib/utils'
import { TopologyMarker, TopologyRegion } from '../../features/interface-topology'

import type { MdiNavigationItem, MdiNavigationSection, MdiPrimaryAction } from './mdi-types'
import { useMdiTopology } from './mdi-topology'

type MdiSidebarProps = {
  applicationName: string
  navigation: MdiNavigationSection[]
  onOpenFeatures: () => void
  organizationName: string
  primaryAction?: MdiPrimaryAction | null
  sidebarContentClassName?: string
}

export function MdiSidebar({
  applicationName,
  navigation,
  onOpenFeatures,
  organizationName,
  primaryAction,
  sidebarContentClassName,
}: MdiSidebarProps) {
  const topology = useMdiTopology()
  return (
    <Sidebar
      className="absolute h-full data-[ito-highlighted=true]:shadow-[inset_0_0_0_2px_rgb(126_34_206/0.92)]"
      collapsible="offcanvas"
      {...topology.regionProps('02')}
    >
      <TopologyMarker id="02" topology={topology} />
      <TopologyRegion
        as={SidebarHeader}
        className="gap-2 border-b px-3 py-3"
        id="02.1"
        topology={topology}
      >
        <div className="flex items-center gap-2.5 px-1">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground text-sm font-semibold text-background">
            C
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{organizationName}</p>
            <p className="truncate text-xs text-muted-foreground">{applicationName}</p>
          </div>
        </div>
        {primaryAction ? (
          <TopologyRegion as="div" id="02.2" topology={topology}>
            <Button className="w-full justify-start" onClick={primaryAction.onSelect}>
              <PlusIcon />
              {primaryAction.label}
            </Button>
          </TopologyRegion>
        ) : null}
      </TopologyRegion>
      <TopologyRegion
        as={SidebarContent}
        className={cn('scrollbar-gutter-stable', sidebarContentClassName)}
        id="02.3"
        topology={topology}
      >
        {navigation.map((section, index) => (
          <NavigationSection key={section.label ?? index} section={section} />
        ))}
      </TopologyRegion>
      <TopologyRegion as={SidebarFooter} className="border-t p-3" id="02.4" topology={topology}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<button type="button" />} onClick={onOpenFeatures}>
              <Settings2Icon />
              <span>Feature settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </TopologyRegion>
      <TopologyRegion as="div" className="contents" id="02.5" topology={topology}>
        <SidebarRail />
      </TopologyRegion>
    </Sidebar>
  )
}

function NavigationSection({ section }: { section: MdiNavigationSection }) {
  const [open, setOpen] = useState(section.defaultOpen ?? section.items.some((item) => item.active))

  useEffect(() => {
    if (section.items.some((item) => item.active)) {
      setOpen(true)
    }
  }, [section.items])

  if (!section.label) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <NavigationItems items={section.items} />
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/navigation-section">
      <SidebarGroup className="px-2 py-0.5">
        <SidebarGroupLabel
          render={
            <CollapsibleTrigger className="w-full cursor-pointer gap-2 rounded-md px-2.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          }
        >
          <LayoutDashboardIcon className="size-4" />
          <span>{section.label}</span>
          <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 ease-out group-data-open/navigation-section:rotate-90" />
        </SidebarGroupLabel>
        <CollapsibleContent className="overflow-hidden transition-[height] duration-200 ease-out">
          <SidebarGroupContent>
            <NavigationItems items={section.items} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function NavigationItems({ items }: { items: MdiNavigationItem[] }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={`${item.label}-${item.href ?? 'action'}`}>
          <NavigationButton item={item} />
          {item.badge !== undefined ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

function NavigationButton({ item }: { item: MdiNavigationItem }) {
  const Icon = item.icon
  const content = (
    <>
      {Icon ? <Icon /> : <span className="size-4 shrink-0" />}
      <span>{item.label}</span>
    </>
  )

  return item.href ? (
    <SidebarMenuButton
      isActive={item.active}
      render={<a href={item.href} />}
      onClick={item.onSelect}
    >
      {content}
    </SidebarMenuButton>
  ) : (
    <SidebarMenuButton
      isActive={item.active}
      render={<button type="button" />}
      onClick={item.onSelect}
    >
      {content}
    </SidebarMenuButton>
  )
}
