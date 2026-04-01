import { NavLink, useLocation } from 'react-router-dom'
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
} from '@admin-web/components/ui/sidebar'
import { BrandGlyph } from '@admin-web/shared/branding/brand-mark'
import { BILLING_NAV_GROUPS, BILLING_NAV_ITEMS, resolveBillingNavPath } from '@billing-web/features/billing/lib/billing-navigation'

const billingNavigationGroups = BILLING_NAV_GROUPS.map((group) => ({
  ...group,
  items: BILLING_NAV_ITEMS.filter((item) => item.group === group.id).map((item) => ({
    ...item,
    to: resolveBillingNavPath(item.path, 'standalone'),
  })),
}))

export function BillingSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto min-h-0 overflow-visible px-2 py-2 group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
            >
              <NavLink to="/dashboard">
                <div className="flex min-w-0 items-center gap-3">
                  <BrandGlyph className="size-11 shrink-0 rounded-[1rem]" iconClassName="size-5" shadowless />
                  <div className="min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-xl font-semibold uppercase tracking-[0.24em] text-foreground">
                      CODEXSUN
                    </p>
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      Business Workspace
                    </p>
                  </div>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {billingNavigationGroups.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label} isActive={isActive}>
                        <NavLink to={item.to}>
                          <ItemIcon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent/30 px-3 py-3 text-sm group-data-[collapsible=icon]:hidden">
          <p className="font-medium text-sidebar-foreground">Codexsun</p>
          <p className="mt-1 text-sidebar-foreground/70">
            Commerce, CRM, HRMS, accounts, and integrations under one brand.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
