import {
  BellRing,
  Building2,
  ChevronRight,
  Database,
  Home,
  Images,
  KeyRound,
  Mail,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Users,
  Workflow,
  Wrench,
} from "lucide-react"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
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
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { queryKeys } from "@cxapp/web/src/query/query-keys"

function isRouteActive(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

const frameworkUtilityGroups = [
  {
    id: "media",
    label: "Media",
    items: [
      {
        icon: Images,
        name: "Media Manager",
        route: "/dashboard/media",
      },
    ],
  },
  {
    id: "mail",
    label: "Mail",
    items: [
      {
        icon: Mail,
        name: "Mail Service",
        route: "/dashboard/mail-service",
      },
    ],
  },
  {
    id: "users",
    label: "Users",
    items: [
      {
        icon: Users,
        name: "Users",
        route: "/dashboard/settings/users",
      },
      {
        icon: ShieldCheck,
        name: "Roles",
        route: "/dashboard/settings/roles",
      },
      {
        icon: KeyRound,
        name: "Permissions",
        route: "/dashboard/settings/permissions",
      },
    ],
  },
  {
    id: "framework",
    label: "Framework",
    items: [
      {
        icon: Building2,
        name: "Companies",
        route: "/dashboard/settings/companies",
      },
      {
        icon: Settings2,
        name: "Core Settings",
        route: "/dashboard/settings/core-settings",
      },
      {
        icon: Building2,
        name: "Companies",
        route: "/dashboard/settings/companies",
      },
    ],
  },
  {
    id: "developer",
    label: "Developer",
    items: [
      {
        icon: Wrench,
        name: "Developer Settings",
        route: "/dashboard/settings/developer-settings",
      },
      {
        icon: ShieldCheck,
        name: "Audit Log",
        route: "/dashboard/settings/activity-log",
      },
      {
        icon: BellRing,
        name: "Alerts Dashboard",
        route: "/dashboard/settings/alerts-dashboard",
      },
      {
        icon: Database,
        name: "Data Backup",
        route: "/dashboard/settings/data-backup",
      },
      {
        icon: Workflow,
        name: "Queue Manager",
        route: "/dashboard/settings/queue-manager",
      },
      {
        icon: ShieldCheck,
        name: "Security Review",
        route: "/dashboard/settings/security-review",
      },
      {
        icon: RefreshCcw,
        name: "System Update",
        route: "/dashboard/system-update",
      },
    ],
  },
] as const

type FrameworkUtilityGroup = (typeof frameworkUtilityGroups)[number]

function getUtilityGroupsForCurrentApp(app: DashboardAppDefinition | null) {
  if (app?.id === "ecommerce") {
    return frameworkUtilityGroups.filter((group) => group.id === "media") as readonly FrameworkUtilityGroup[]
  }

  return frameworkUtilityGroups as readonly FrameworkUtilityGroup[]
}

function isMenuItemActive(pathname: string, item: DashboardAppDefinition["menuGroups"][number]["items"][number]) {
  return isRouteActive(pathname, item.route) || item.children?.some((child) => isRouteActive(pathname, child.route)) || false
}

function useDemoMenuCounts(isActive: boolean) {
  const query = useQuery({
    queryKey: queryKeys.demoSummary,
    enabled: isActive,
    queryFn: async () => {
      const accessToken = getStoredAccessToken()
      const response = await fetch("/internal/v1/demo/summary", {
        cache: "no-store",
        headers: accessToken
          ? {
              authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`)
      }

      return (await response.json()) as {
        modules: Array<{ id: string; currentCount: number }>
      }
    },
  })

  useEffect(() => {
    if (!isActive) {
      return
    }
    const handleRefresh = () => {
      void query.refetch()
    }

    window.addEventListener("demo-summary-updated", handleRefresh)

    return () => {
      window.removeEventListener("demo-summary-updated", handleRefresh)
    }
  }, [isActive, query.refetch])

  const moduleCountMap = Object.fromEntries(
    (query.data?.modules ?? []).map((module) => [module.id, module.currentCount])
  ) as Record<string, number>

  return {
    "/dashboard/apps/demo/companies": moduleCountMap.companies ?? 0,
    "/dashboard/apps/demo/common": moduleCountMap.common ?? 0,
    "/dashboard/apps/demo/contacts": moduleCountMap.contacts ?? 0,
    "/dashboard/apps/demo/products": moduleCountMap.products ?? 0,
    "/dashboard/apps/demo/categories": moduleCountMap.categories ?? 0,
    "/dashboard/apps/demo/customers": moduleCountMap.customers ?? 0,
    "/dashboard/apps/demo/orders": moduleCountMap.orders ?? 0,
    "/dashboard/apps/demo/billing": moduleCountMap.billing ?? 0,
    "/dashboard/apps/demo/frappe": moduleCountMap.frappe ?? 0,
  }
}

function MenuCountBadge({
  value,
  className = "",
}: {
  value?: number
  className?: string
}) {
  if (value == null) {
    return null
  }

  return (
    <span className={`inline-flex min-w-6 items-center justify-center rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[11px] font-semibold text-sidebar-accent-foreground ${className}`}>
      {value}
    </span>
  )
}

function GroupedAppMenu({
  app,
  groupLabel,
  open,
  pathname,
  demoMenuCounts,
}: {
  app: DashboardAppDefinition
  groupLabel: string
  open: boolean
  pathname: string
  demoMenuCounts?: Record<string, number>
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
          {app.menuGroups.filter((group) => group.items.length > 0).map((group) => {
            const GroupIcon = group.icon ?? group.items[0]?.icon
            const hasNestedChildren = group.items.some((item) => (item.children?.length ?? 0) > 0)
            const hasChildren = group.items.length > 1 || hasNestedChildren
            const isGroupActive = group.items.some((item) =>
              isMenuItemActive(pathname, item)
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
                          {item.children && item.children.length > 0 ? (
                            <Collapsible
                              defaultOpen={item.children.some((child) =>
                                isRouteActive(pathname, child.route)
                              )}
                              className="group/collapsible"
                            >
                              <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton isActive={isMenuItemActive(pathname, item)}>
                                  <item.icon className="size-4" />
                                  <span>{item.name}</span>
                                  <MenuCountBadge value={demoMenuCounts?.[item.route]} className="ml-auto" />
                                  <ChevronRight className="ml-2 size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuSubButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-2 ml-4 space-y-1 border-l border-sidebar-border pl-3">
                                  {item.children.map((child) => (
                                    <NavLink
                                      key={child.id}
                                      to={child.route}
                                      className={({ isActive }) =>
                                        isActive || isRouteActive(pathname, child.route)
                                          ? "flex rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-accent-foreground bg-sidebar-accent"
                                          : "flex rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                      }
                                    >
                                      <span>{child.name}</span>
                                      <MenuCountBadge value={demoMenuCounts?.[child.route]} className="ml-auto" />
                                    </NavLink>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <SidebarMenuSubButton
                              asChild
                              isActive={isRouteActive(pathname, item.route)}
                            >
                              <NavLink to={item.route}>
                                <item.icon className="size-4" />
                                <span>{item.name}</span>
                                <MenuCountBadge value={demoMenuCounts?.[item.route]} className="ml-auto" />
                              </NavLink>
                            </SidebarMenuSubButton>
                          )}
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

function UtilityNavigationMenu({
  open,
  pathname,
  groups = frameworkUtilityGroups,
}: {
  open: boolean
  pathname: string
  groups?: readonly FrameworkUtilityGroup[]
}) {
  if (!open) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {groups.flatMap((group) =>
              group.items.map((item) => (
                <SidebarMenuItem key={item.route}>
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
              ))
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <>
      {groups.map((group) => {
        const GroupIcon = group.items[0]?.icon
        const isGroupActive = group.items.some((item) => isRouteActive(pathname, item.route))

        return (
          <SidebarGroup key={group.id}>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible defaultOpen={isGroupActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isGroupActive} className="pr-2">
                        {GroupIcon ? <GroupIcon className="size-4" /> : null}
                        <span>{group.label}</span>
                        <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.route}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isRouteActive(pathname, item.route)}
                            >
                              <NavLink to={item.route}>
                                <item.icon className="size-4" />
                                <span>{item.name}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      })}
    </>
  )
}

export function AppSidebar() {
  const { apps, brand, currentApp, links, user } = useDashboardShell()
  const location = useLocation()
  const { open } = useSidebar()
  const showDeskGroup = location.pathname === links.dashboard
  const currentAppUtilityGroups = getUtilityGroupsForCurrentApp(currentApp)
  const demoMenuCounts = useDemoMenuCounts(currentApp?.id === "demo")
  const showFrameworkUtilityGroups =
    showDeskGroup ||
    isRouteActive(location.pathname, "/dashboard/mail-service") ||
    isRouteActive(location.pathname, links.mediaManager) ||
    isRouteActive(location.pathname, links.settings) ||
    isRouteActive(location.pathname, links.systemUpdate)

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
                alt={brand.name}
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

          </>
        ) : null}

        {showFrameworkUtilityGroups ? (
          <UtilityNavigationMenu
            open={open}
            pathname={location.pathname}
          />
        ) : null}

        {currentApp ? (
          <>
            <GroupedAppMenu
              app={currentApp}
              groupLabel={
                currentApp.id === "ui"
                  ? "Platform"
                  : currentApp.id === "core"
                    ? "Core"
                    : currentApp.id === "ecommerce"
                      ? "Ecommerce"
                    : "Workspace"
              }
              open={open}
              pathname={location.pathname}
              demoMenuCounts={demoMenuCounts}
            />
            {currentAppUtilityGroups.length > 0 ? (
              <UtilityNavigationMenu
                open={open}
                pathname={location.pathname}
                groups={currentAppUtilityGroups}
              />
            ) : null}
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
