import * as React from 'react'
import { BookOpen, ChevronRightIcon } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@codexsun/ui/components/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@codexsun/ui/components/sidebar'

export type DocumentationNavigation = {
  items: Array<{ isActive?: boolean; onSelect?: () => void; title: string; url: string }>
  title: string
}

/** Shared, data-driven form of the Shadcn sidebar-03 block. */
export function AppSidebar({
  navigation,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  navigation: DocumentationNavigation[]
}) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto items-start overflow-visible py-3">
              <span className="flex items-start gap-2 whitespace-normal">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BookOpen className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                  <span className="font-medium">Documentation</span>
                  <span className="text-xs text-sidebar-foreground/70">Repository handbook</span>
                </div>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigation.map((section) => (
              <Collapsible
                key={section.title}
                defaultOpen={section.items.some((item) => item.isActive)}
                className="group/collapsible"
                render={<SidebarMenuItem />}
              >
                <CollapsibleTrigger
                  render={<SidebarMenuButton className="h-auto overflow-visible py-1.5" />}
                >
                  <span className="whitespace-normal text-xs font-semibold tracking-wide text-sidebar-foreground/70">
                    {section.title}
                  </span>
                  <ChevronRightIcon className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {section.items.map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton
                          href={item.url}
                          isActive={item.isActive}
                          onClick={item.onSelect}
                          className="h-auto overflow-visible whitespace-normal py-1.5 leading-5"
                        >
                          {item.title}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
