import { ChevronRightIcon, LayoutDashboardIcon } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@codexsun/ui/components/collapsible'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@codexsun/ui/components/sidebar'
import { cn } from '@codexsun/ui/lib/utils'

import type { MdiNavigationItem, MdiNavigationSection } from './mdi-types'
import { usePersistentOpenState } from './use-mdi-sidebar-state'

export function NavigationSection({
  section,
  stateKey,
}: {
  section: MdiNavigationSection
  stateKey?: string
}) {
  const hasActiveItem = section.items.some(hasActiveNavigationItem)
  const [open, setOpen] = usePersistentOpenState(stateKey, section.defaultOpen ?? hasActiveItem)
  const SectionIcon = section.icon ?? LayoutDashboardIcon

  if (!section.label) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <NavigationItems items={section.items} stateKey={stateKey} />
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/navigation-section">
      <SidebarGroup className="px-2 py-0.5">
        <SidebarGroupLabel
          render={
            <CollapsibleTrigger className="h-9 w-full cursor-pointer gap-2 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          }
        >
          <SectionIcon className="size-4" />
          <span>{section.label}</span>
          <ChevronRightIcon className="ml-auto size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-open/navigation-section:rotate-90 motion-reduce:transition-none" />
        </SidebarGroupLabel>
        <CollapsibleContent className="h-0 overflow-hidden opacity-0 transition-[height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:h-[var(--collapsible-panel-height)] data-open:opacity-100 motion-reduce:transition-none">
          <SidebarGroupContent className="ml-5 w-auto border-l border-sidebar-border/80 py-1 pr-1 pl-2.5">
            <NavigationItems compact items={section.items} stateKey={stateKey} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function NavigationItems({
  compact = false,
  items,
  stateKey,
}: {
  compact?: boolean
  items: MdiNavigationItem[]
  stateKey?: string
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <NavigationItem
          compact={compact}
          item={item}
          key={`${item.label}-${item.href ?? 'group'}`}
          stateKey={stateKey ? `${stateKey}:item:${item.label}` : undefined}
        />
      ))}
    </SidebarMenu>
  )
}

function NavigationItem({
  compact,
  item,
  stateKey,
}: {
  compact: boolean
  item: MdiNavigationItem
  stateKey?: string
}) {
  const children = item.children ?? []
  if (children.length === 0) {
    return (
      <SidebarMenuItem>
        <NavigationButton compact={compact} item={item} />
        {item.badge !== undefined ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
      </SidebarMenuItem>
    )
  }

  return <NavigationBranch compact={compact} item={item} stateKey={stateKey} />
}

function NavigationBranch({
  compact,
  item,
  nested = false,
  stateKey,
}: {
  compact: boolean
  item: MdiNavigationItem
  nested?: boolean
  stateKey?: string
}) {
  const children = item.children ?? []
  const containsActive = children.some(hasActiveNavigationItem)
  const [open, setOpen] = usePersistentOpenState(stateKey, item.defaultOpen ?? containsActive)
  const Icon = item.icon

  const content = (
    <Collapsible open={open} onOpenChange={setOpen} className="group/navigation-branch">
      <CollapsibleTrigger
        className={cn(
          'flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          compact && 'px-2',
        )}
      >
        {Icon ? <Icon className="size-4 shrink-0" /> : <span className="size-4 shrink-0" />}
        <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
        <ChevronRightIcon className="size-3.5 shrink-0 transition-transform duration-200 group-data-open/navigation-branch:rotate-90 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-0 overflow-hidden opacity-0 transition-[height,opacity] duration-200 ease-out data-open:h-[var(--collapsible-panel-height)] data-open:opacity-100 motion-reduce:transition-none">
        <SidebarMenuSub className="my-1 mr-0 ml-3.5">
          {children.map((child) => (
            <SidebarMenuSubItem key={`${child.label}-${child.href ?? 'group'}`}>
              <NavigationSubtree
                item={child}
                stateKey={stateKey ? `${stateKey}:child:${child.label}` : undefined}
              />
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )

  return nested ? content : <SidebarMenuItem>{content}</SidebarMenuItem>
}

function NavigationSubtree({ item, stateKey }: { item: MdiNavigationItem; stateKey?: string }) {
  const children = item.children ?? []
  if (children.length === 0) return <NavigationSubButton item={item} />

  return <NavigationBranch compact item={item} nested stateKey={stateKey} />
}

function NavigationSubButton({ item }: { item: MdiNavigationItem }) {
  const Icon = item.icon
  const content = (
    <>
      {Icon ? <Icon /> : <span className="size-4 shrink-0" />}
      <span>{item.label}</span>
    </>
  )

  return item.href ? (
    <SidebarMenuSubButton
      isActive={item.active}
      render={<a href={item.href} />}
      onClick={item.onSelect}
    >
      {content}
    </SidebarMenuSubButton>
  ) : (
    <SidebarMenuSubButton
      isActive={item.active}
      render={<button type="button" />}
      onClick={item.onSelect}
    >
      {content}
    </SidebarMenuSubButton>
  )
}

function hasActiveNavigationItem(item: MdiNavigationItem): boolean {
  return item.active === true || item.children?.some(hasActiveNavigationItem) === true
}

function NavigationButton({ compact, item }: { compact: boolean; item: MdiNavigationItem }) {
  const Icon = item.icon
  const content = (
    <>
      {Icon ? <Icon /> : <span className="size-4 shrink-0" />}
      <span>{item.label}</span>
    </>
  )

  return item.href ? (
    <SidebarMenuButton
      className={compact ? 'h-8 px-2' : undefined}
      isActive={item.active}
      render={<a href={item.href} />}
      onClick={item.onSelect}
    >
      {content}
    </SidebarMenuButton>
  ) : (
    <SidebarMenuButton
      className={compact ? 'h-8 px-2' : undefined}
      isActive={item.active}
      render={<button type="button" />}
      onClick={item.onSelect}
    >
      {content}
    </SidebarMenuButton>
  )
}
