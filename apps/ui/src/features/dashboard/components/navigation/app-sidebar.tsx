import { Cog, Home, RefreshCcw } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router-dom"

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
  useSidebar,
} from "@/components/ui/sidebar"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { NavUser } from "@/features/dashboard/components/navigation/nav-user"

function isRouteActive(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
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
          <SidebarGroup>
            <SidebarGroupLabel>{currentApp.name}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  ...currentApp.menuGroups.flatMap((group) => group.items),
                  {
                    id: `${currentApp.id}-settings`,
                    name: "Settings",
                    route: links.settings,
                    icon: Cog,
                  },
                ].map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isRouteActive(location.pathname, item.route)}
                    >
                      <NavLink to={item.route}>
                        <item.icon className="size-4" />
                        {open ? <span>{item.name}</span> : null}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
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
