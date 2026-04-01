"use client"

import * as React from "react"
import type { SystemVersion } from "@shared/index"
import { Blocks, ChevronRight, LayoutDashboard, RefreshCcw, Settings2 } from "lucide-react"
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@framework-core/web/auth/components/auth-provider"
import { buildAdminPortalPath } from "@framework-core/web/auth/lib/portal-routing"
import { NavUser } from "@/features/dashboard/components/navigation/nav-user"
import { useDesk } from "@/features/framework/desk/desk-provider"
import { matchesDeskRoute } from "@/features/framework/desk/desk-registry"
import { commonModuleMenuGroups, getCommonModuleHref } from "@/features/common-modules/config/common-module-navigation"
import { getSystemVersion } from "@/shared/api/client"
import { BrandGlyph } from "@/shared/branding/brand-mark"
import { useBranding } from "@/shared/branding/branding-provider"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session, logout } = useAuth()
  const branding = useBranding()
  const { state: sidebarState } = useSidebar()
  const { apps, currentApp, services } = useDesk()
  const location = useLocation()
  const [systemVersion, setSystemVersion] = React.useState<SystemVersion | null>(null)
  const canManageUsers = Boolean(
    session?.user.isSuperAdmin || session?.user.permissions.some((permission) => permission.key === 'users:manage'),
  )

  React.useEffect(() => {
    let cancelled = false

    void getSystemVersion()
      .then((version) => {
        if (!cancelled) {
          setSystemVersion(version)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const coreCommonGroups = React.useMemo(() => {
    const menuGroupByKey = Object.fromEntries(commonModuleMenuGroups.map((group) => [group.key, group]))

    return [
      {
        key: "location",
        label: "Location",
        items: menuGroupByKey.location?.items ?? [],
      },
      {
        key: "product",
        label: "Product",
        items: menuGroupByKey.catalog?.items ?? [],
      },
      {
        key: "contacts",
        label: "Contacts",
        items: menuGroupByKey.contacts?.items ?? [],
      },
      {
        key: "order",
        label: "Order",
        items: [
          ...(menuGroupByKey.inventory?.items ?? []),
          ...(menuGroupByKey.commercial?.items ?? []),
        ],
      },
      {
        key: "others",
        label: "Others",
        items: menuGroupByKey.storefront?.items ?? [],
      },
      {
        key: "unknown",
        label: "Unknown",
        items: [
          {
            key: "common-desk",
            title: "Common Desk",
            icon: Blocks,
            description: "Fallback common workspace and unknown/default master entry point.",
            href: buildAdminPortalPath("/common"),
          },
        ],
      },
    ]
  }, [])

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto min-h-0 overflow-visible px-2 py-2 group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
            >
              <NavLink to={buildAdminPortalPath()}>
                <div className="flex min-w-0 items-center gap-3">
                  <BrandGlyph
                    shadowless
                    className="size-10 shrink-0 rounded-xl"
                    iconClassName="size-5"
                  />
                  {sidebarState === "expanded" ? (
                    <div className="min-w-0 flex-1 text-left leading-tight">
                      <p className="truncate text-base font-semibold uppercase tracking-[0.2em] text-foreground">
                        {branding.brandName}
                      </p>
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {branding.tagline}
                      </p>
                    </div>
                  ) : null}
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {!currentApp ? (
          <SidebarGroup>
            <SidebarGroupLabel>Desk</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Application desk">
                    <NavLink to={buildAdminPortalPath()}>
                      <LayoutDashboard />
                      <span>All Apps</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {apps.map((app) => {
                  const AppIcon = app.icon

                  return (
                    <SidebarMenuItem key={app.id}>
                      <SidebarMenuButton asChild tooltip={app.name}>
                        <NavLink to={app.route}>
                          <AppIcon />
                          <span>{app.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {currentApp ? (
          currentApp.menuGroups.map((group) => (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                {currentApp.id === "core" && group.label === "Common" ? (
                  <SidebarMenu>
                    <Collapsible asChild defaultOpen={false}>
                      <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Common">
                          <span>Common</span>
                        </SidebarMenuButton>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuAction className="data-[state=open]:rotate-90">
                            <ChevronRight />
                            <span className="sr-only">Toggle common modules</span>
                          </SidebarMenuAction>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {coreCommonGroups.map((commonGroup) => (
                              <Collapsible key={commonGroup.key} asChild defaultOpen={commonGroup.key === "location"}>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild>
                                    <button type="button" className="w-full justify-between">
                                      <span>{commonGroup.label}</span>
                                      <CollapsibleTrigger asChild>
                                        <span className="ml-auto inline-flex">
                                          <ChevronRight className="size-4 transition-transform data-[state=open]:rotate-90" />
                                        </span>
                                      </CollapsibleTrigger>
                                    </button>
                                  </SidebarMenuSubButton>
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {commonGroup.items.map((item) => {
                                        const href = "href" in item ? item.href : getCommonModuleHref(item.key)
                                        const ItemIcon = item.icon
                                        const isActive = location.pathname === href || location.pathname.startsWith(`${href}/`)

                                        return (
                                          <SidebarMenuSubItem key={item.key}>
                                            <SidebarMenuSubButton asChild isActive={isActive}>
                                              <Link to={href}>
                                                <ItemIcon />
                                                <span>{item.title}</span>
                                              </Link>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        )
                                      })}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </SidebarMenuSubItem>
                              </Collapsible>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  </SidebarMenu>
                ) : (
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const ItemIcon = item.icon

                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            asChild
                            tooltip={item.name}
                            isActive={matchesDeskRoute(location.pathname, item.route, item.matchRoutes)}
                          >
                            <Link to={item.route}>
                              <ItemIcon />
                              <span>{item.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        ) : null}

        {!currentApp ? (
          <SidebarGroup>
            <SidebarGroupLabel>Framework</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {services.map((service) => {
                  const ServiceIcon = service.icon
                  const isDatabaseService = service.id === 'database'
                  const isAuthService = service.id === 'auth'
                  const isConfigService = service.id === 'config'
                  const canOpenDatabaseManager = isDatabaseService && Boolean(session?.user.isSuperAdmin)
                  const canOpenUsers = isAuthService && canManageUsers
                  const canOpenEnvironment = isConfigService && Boolean(session?.user.isSuperAdmin)

                  return (
                    <SidebarMenuItem key={service.id}>
                      {canOpenDatabaseManager ? (
                        <SidebarMenuButton
                          asChild
                          tooltip={service.name}
                          isActive={location.pathname === buildAdminPortalPath('/migration-manager') || location.pathname.startsWith(`${buildAdminPortalPath('/migration-manager')}/`)}
                        >
                          <NavLink to={buildAdminPortalPath('/migration-manager')}>
                            <ServiceIcon />
                            <span>{service.name}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      ) : canOpenUsers ? (
                        <SidebarMenuButton
                          asChild
                          tooltip={service.name}
                          isActive={location.pathname === buildAdminPortalPath('/users') || location.pathname.startsWith(`${buildAdminPortalPath('/users')}/`)}
                        >
                          <NavLink to={buildAdminPortalPath('/users')}>
                            <ServiceIcon />
                            <span>{service.name}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      ) : canOpenEnvironment ? (
                        <SidebarMenuButton
                          asChild
                          tooltip={service.name}
                          isActive={location.pathname === buildAdminPortalPath('/environment') || location.pathname.startsWith(`${buildAdminPortalPath('/environment')}/`)}
                        >
                          <NavLink to={buildAdminPortalPath('/environment')}>
                            <ServiceIcon />
                            <span>{service.name}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton disabled tooltip={service.name} className="cursor-default opacity-80">
                          <ServiceIcon />
                          <span>{service.name}</span>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  )
                })}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Settings">
                    <NavLink to={buildAdminPortalPath('/settings')}>
                      <Settings2 />
                      <span>Settings</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="System Update">
                    <NavLink to={buildAdminPortalPath('/system-update')}>
                      <RefreshCcw />
                      <span>System Update</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: session?.user.displayName ?? "Workspace user",
            email: session?.user.email ?? "No email",
            avatar: session?.user.avatarUrl ?? null,
            actorType: session?.user.actorType ?? "operator",
          }}
          onLogout={logout}
          systemVersion={systemVersion}
          showAdminLinks={Boolean(session?.user.isSuperAdmin)}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
