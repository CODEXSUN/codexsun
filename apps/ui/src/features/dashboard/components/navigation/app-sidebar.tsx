import { ChevronRight, Cog, Home, RefreshCcw } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { NavUser } from "@/features/dashboard/components/navigation/nav-user"
import type { DashboardAppDefinition } from "@/features/dashboard/types"

function isRouteActive(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function GroupedAppMenu({
  app,
  groupLabel,
  open,
  pathname,
}: {
  app: DashboardAppDefinition
  groupLabel: string
  open: boolean
  pathname: string
}) {
  if (!open) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {app.modules.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isRouteActive(pathname, item.route)}
                  tooltip={item.name}
                >
                  <NavLink to={item.route}>
                    <item.icon className="size-4" />
                    <span className="sr-only">{item.name}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {app.menuGroups.map((group) => {
            const GroupIcon = group.items[0]?.icon
            const hasChildren = group.items.length > 1
            const isGroupActive = group.items.some((item) =>
              isRouteActive(pathname, item.route)
            )

            if (!hasChildren) {
              const item = group.items[0]

              if (!item) {
                return null
              }

              return (
                <SidebarMenuItem key={group.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isRouteActive(pathname, item.route)}
                  >
                    <NavLink to={item.route}>
                      <item.icon className="size-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            return (
              <Collapsible
                key={group.id}
                defaultOpen={isGroupActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isGroupActive}
                      className="pr-2"
                    >
                      {GroupIcon ? <GroupIcon className="size-4" /> : null}
                      <span>{group.label}</span>
                      <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {group.items.map((item) => (
                        <SidebarMenuSubItem key={item.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isRouteActive(pathname, item.route)}
                          >
                            <NavLink to={item.route}>
                              <span>{item.name}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const { apps, brand, currentApp, links, services, user } = useDashboardShell()
  const location = useLocation()
  const { open } = useSidebar()
  const showDeskGroup = location.pathname === links.dashboard

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Link
          to={links.dashboard}
          className={`block ${open ? "px-1 py-1" : "px-0 py-1"}`}
        >
          <div className={`flex items-center ${open ? "gap-3" : "justify-center"}`}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
              <img
                src="/logo.svg"
                alt="codexsun"
                className="size-6 object-contain"
              />
            </div>
            {open ? (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate whitespace-nowrap text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
                  {brand.name}
                </p>
                <p className="truncate whitespace-nowrap text-sm text-muted-foreground">
                  {brand.tagline}
                </p>
              </div>
            ) : null}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {showDeskGroup ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Desk</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === links.dashboard}
                    >
                      <NavLink to={links.dashboard}>
                        <Home className="size-4" />
                        {open ? <span>Application Desk</span> : null}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {apps.map((app) => (
                    <SidebarMenuItem key={app.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isRouteActive(location.pathname, app.route)}
                      >
                        <NavLink to={app.route}>
                          <app.icon className="size-4" />
                          {open ? <span>{app.name}</span> : null}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Framework</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isRouteActive(location.pathname, links.settings)}
                    >
                      <NavLink to={links.settings}>
                        <Cog className="size-4" />
                        {open ? <span>Settings</span> : null}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isRouteActive(location.pathname, links.systemUpdate)}
                    >
                      <NavLink to={links.systemUpdate}>
                        <RefreshCcw className="size-4" />
                        {open ? <span>System Update</span> : null}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {services.map((service) => (
                    <SidebarMenuItem key={service.id}>
                      <SidebarMenuButton asChild>
                        <NavLink to={links.systemUpdate}>
                          <service.icon className="size-4" />
                          {open ? <span>{service.name}</span> : null}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}

        {currentApp ? (
          <>
            <GroupedAppMenu
              app={currentApp}
              groupLabel={currentApp.id === "ui" ? "Platform" : "Workspace"}
              open={open}
              pathname={location.pathname}
            />
            <SidebarGroup>
              <SidebarGroupLabel>Application</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isRouteActive(location.pathname, links.settings)}
                    >
                      <NavLink to={links.settings}>
                        <Cog className="size-4" />
                        {open ? <span>Settings</span> : null}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user.displayName,
            email: user.email,
            avatar: user.avatarUrl,
            actorType: user.actorType,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
