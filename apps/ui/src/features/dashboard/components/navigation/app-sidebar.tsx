import {
  BellRing,
  Building2,
  ChevronRight,
  Database,
  Images,
  KeyRound,
  Mail,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Server,
  Users,
  Workflow,
  Wrench,
} from "lucide-react"
import type { CSSProperties } from "react"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, NavLink, useLocation } from "react-router-dom"

import {
  storefrontSettingsSchema,
  storefrontSettingsWorkflowStatusSchema,
  type StorefrontMenuSurfaceDesign,
} from "@ecommerce/shared"
import { applicationVersion } from "../../../../../../framework/shared/index.js"
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
import { resolveRuntimeBrandLogoUrl } from "@/features/branding/runtime-brand-logo"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { NavUser } from "@/features/dashboard/components/navigation/nav-user"
import type { DashboardAppDefinition } from "@/features/dashboard/types"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { useRuntimeAppSettings } from "@cxapp/web/src/features/runtime-app-settings/runtime-app-settings-provider"
import { queryKeys } from "@cxapp/web/src/query/query-keys"

function isRouteActive(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

type FrameworkUtilityItem = {
  icon: typeof Server
  name: string
  route: string
  requiresSuperAdmin?: boolean
}

type FrameworkUtilityGroup = {
  id: string
  label: string
  items: FrameworkUtilityItem[]
}

const frameworkUtilityGroups: FrameworkUtilityGroup[] = [
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
      {
        icon: Settings2,
        name: "Mail Settings",
        route: "/dashboard/settings/mail-settings",
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
    ],
  },
  {
    id: "server-client",
    label: "Server / Client",
    items: [
      {
        icon: Server,
        name: "Live Servers",
        route: "/dashboard/live-servers",
        requiresSuperAdmin: true,
      },
      {
        icon: KeyRound,
        name: "Generate Key",
        route: "/dashboard/live-server-key-generator",
        requiresSuperAdmin: true,
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
        icon: RefreshCcw,
        name: "System Update",
        route: "/dashboard/system-update",
      },
      {
        icon: ShieldCheck,
        name: "Security Review",
        route: "/dashboard/settings/security-review",
      },
    ],
  },
]

function getUtilityGroupsForCurrentApp(
  app: DashboardAppDefinition | null,
  isSuperAdmin: boolean
) {
  const visibleGroups = frameworkUtilityGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.requiresSuperAdmin || isSuperAdmin),
    }))
    .filter((group) => group.items.length > 0)

  if (app?.id === "billing") {
    return []
  }

  if (app?.id === "ecommerce") {
    return visibleGroups.filter((group) => group.id === "media") as readonly FrameworkUtilityGroup[]
  }

  if (app?.id === "stock") {
    return []
  }

  return visibleGroups as readonly FrameworkUtilityGroup[]
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

function getSidebarLogoFrameStyle(design: StorefrontMenuSurfaceDesign): CSSProperties {
  return {
    width: `${design.frameWidth}px`,
    height: `${design.frameHeight}px`,
    backgroundColor: design.areaBackgroundColor,
  }
}

function getSidebarLogoImageStyle(design: StorefrontMenuSurfaceDesign): CSSProperties {
  return {
    width: `${design.logoWidth}px`,
    height: `${design.logoHeight}px`,
    transform: `translate(${design.offsetX}px, ${design.offsetY}px)`,
    backgroundColor: design.logoBackgroundColor,
  }
}

function useSidebarMenuDesigner() {
  const query = useQuery({
    queryKey: ["storefront", "menu-designer", "workflow"],
    queryFn: async () => {
      const accessToken = getStoredAccessToken()

      if (accessToken) {
        const workflowResponse = await fetch("/internal/v1/ecommerce/storefront-settings/workflow", {
          cache: "no-store",
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        })

        if (workflowResponse.ok) {
          const workflowPayload = storefrontSettingsWorkflowStatusSchema.parse(
            await workflowResponse.json()
          )
          return workflowPayload.previewSettings.menuDesigner
        }
      }

      const response = await fetch("/public/v1/storefront/settings", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`)
      }

      const payload = storefrontSettingsSchema.parse(await response.json())
      return payload.menuDesigner
    },
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const handleInvalidate = () => {
      void query.refetch()
    }

    window.addEventListener("storefront-shell-invalidated", handleInvalidate)

    return () => {
      window.removeEventListener("storefront-shell-invalidated", handleInvalidate)
    }
  }, [query.refetch])

  return query.data ?? null
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
  const { brand, currentApp, links, user } = useDashboardShell()
  const { brand: runtimeBrand } = useRuntimeBrand()
  const { settings } = useRuntimeAppSettings()
  const location = useLocation()
  const { open } = useSidebar()
  const isDashboardRoot = location.pathname === links.dashboard
  const currentAppUtilityGroups = getUtilityGroupsForCurrentApp(
    currentApp,
    user.isSuperAdmin
  )
  const demoMenuCounts = useDemoMenuCounts(currentApp?.id === "demo")
  const menuDesigner = useSidebarMenuDesigner()
  const appMenuDesign = menuDesigner?.appMenu ?? null
  const effectiveAppMenuDesign: StorefrontMenuSurfaceDesign = appMenuDesign ?? {
    logoVariant: "primary",
    frameWidth: 48,
    frameHeight: 40,
    logoWidth: 24,
    logoHeight: 24,
    offsetX: 0,
    offsetY: 0,
    logoHoverColor: "#8b5e34",
    areaBackgroundColor: "#ffffff",
    logoBackgroundColor: "#00000000",
  }
  const showFrameworkUtilityGroups =
    isDashboardRoot ||
    isRouteActive(location.pathname, "/dashboard/mail-service") ||
    isRouteActive(location.pathname, "/dashboard/settings/mail-settings") ||
    isRouteActive(location.pathname, links.mediaManager) ||
    isRouteActive(location.pathname, links.settings) ||
    isRouteActive(location.pathname, links.systemUpdate) ||
    isRouteActive(location.pathname, "/dashboard/live-servers") ||
    isRouteActive(location.pathname, "/dashboard/live-server-key-generator")

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Link
          to={links.dashboard}
          className={`group block ${open ? "px-1 py-1" : "px-0 py-1"}`}
          style={
            {
              "--app-menu-logo-hover-color": appMenuDesign?.logoHoverColor ?? "#8b5e34",
            } as CSSProperties
          }
          >
            <div
              className={`flex items-center ${open ? "gap-3" : "justify-center"}`}
            >
              <div
                className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sidebar-border shadow-sm transition-colors duration-200"
                style={getSidebarLogoFrameStyle(effectiveAppMenuDesign)}
              >
                <img
                  src={resolveRuntimeBrandLogoUrl(
                    runtimeBrand,
                    effectiveAppMenuDesign.logoVariant
                  )}
                  alt={brand.name}
                  className="absolute object-contain"
                  style={getSidebarLogoImageStyle(effectiveAppMenuDesign)}
                />
              </div>
            {open ? (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate whitespace-nowrap text-sm font-semibold uppercase tracking-[0.22em] text-foreground transition-colors duration-200 group-hover:text-[var(--app-menu-logo-hover-color)]">
                  {brand.name}
                </p>
                <p className="truncate whitespace-nowrap text-sm text-muted-foreground transition-colors duration-200 group-hover:text-[var(--app-menu-logo-hover-color)]">
                  {brand.tagline}
                </p>
              </div>
            ) : null}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
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
        {open ? (
          <div className="px-2 pb-2 text-[11px] leading-4 text-sidebar-foreground/55">
            {settings?.applicationVersion.label ?? applicationVersion.label}
          </div>
        ) : null}
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
