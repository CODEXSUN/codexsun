"use client"

import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
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
import { useAuth } from "@framework-core/web/auth/components/auth-provider"
import { buildCustomerPortalPath } from "@framework-core/web/auth/lib/portal-routing"
import { CustomerNavUser } from "@/features/customer-portal/components/navigation/customer-nav-user"
import { customerPortalLinks } from "@/features/customer-portal/lib/customer-portal-nav"
import { BrandGlyph } from "@/shared/branding/brand-mark"
import { useBranding } from "@/shared/branding/branding-provider"

export function CustomerPortalSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session, logout } = useAuth()
  const branding = useBranding()
  const location = useLocation()
  const { state: sidebarState } = useSidebar()

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto min-h-0 overflow-visible px-2 py-2 group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
            >
              <NavLink to={buildCustomerPortalPath()}>
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
                        Customer portal
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
        <SidebarGroup>
          <SidebarGroupLabel>My Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customerPortalLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton asChild tooltip={link.title} isActive={location.pathname === link.href}>
                    <NavLink to={link.href}>
                      <link.icon />
                      <span>{link.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <CustomerNavUser
          user={{
            name: session?.user.displayName ?? "Customer",
            email: session?.user.email ?? "No email",
            avatar: session?.user.avatarUrl ?? null,
          }}
          onLogout={logout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
