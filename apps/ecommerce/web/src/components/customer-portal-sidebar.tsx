import {
  Bell,
  BadgeCheck,
  ChevronsUpDown,
  Headphones,
  LogOut,
  Store,
} from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useAuth } from "@cxapp/web/src/auth/auth-context"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { cn } from "@/lib/utils"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { customerPortalSections, type PortalSectionId } from "../lib/customer-portal"
import { storefrontPaths } from "../lib/storefront-routes"

function toInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "CP"
  )
}

export function CustomerPortalSidebar({
  activeSection,
}: {
  activeSection: PortalSectionId
}) {
  const { brand } = useRuntimeBrand()
  const customerAuth = useStorefrontCustomerAuth()
  const auth = useAuth()
  const navigate = useNavigate()
  const { open } = useSidebar()
  const displayName = customerAuth.customer?.displayName ?? "Customer"
  const email = customerAuth.customer?.email ?? ""
  const avatarUrl = auth.user?.avatarUrl ?? null

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <NavLink
          to={storefrontPaths.account()}
          className={cn("block", open ? "px-1 py-1" : "px-0 py-1")}
        >
          <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
              <img
                src="/logo.svg"
                alt={brand?.brandName ?? "Customer Portal"}
                className="size-6 object-contain"
              />
            </div>
            {open ? (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate whitespace-nowrap text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
                  {brand?.brandName ?? "Codexsun"}
                </p>
                <p className="truncate whitespace-nowrap text-sm text-muted-foreground">
                  Customer Portal
                </p>
              </div>
            ) : null}
          </div>
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customerPortalSections.map((section) => (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === section.id}
                    tooltip={section.label}
                  >
                    <NavLink
                      to={
                        section.id === "overview"
                          ? storefrontPaths.account()
                          : storefrontPaths.accountSection(section.id)
                      }
                    >
                      <section.icon className="size-4" />
                      {open ? <span>{section.label}</span> : null}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {open ? (
          <SidebarGroup>
            <SidebarGroupLabel>Shopping</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2 px-1">
                <Button asChild variant="outline" className="w-full justify-start rounded-xl">
                  <NavLink to={storefrontPaths.catalog()}>
                    <Store className="size-4" />
                    Continue shopping
                  </NavLink>
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={
                    open
                      ? "rounded-2xl border border-sidebar-border bg-background/80 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      : "mx-auto size-11 rounded-xl border border-sidebar-border bg-background/80 p-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  }
                >
                  <Avatar className="size-8 rounded-lg">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                    <AvatarFallback className="rounded-lg">
                      {toInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  {open ? (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{displayName}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {email}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </>
                  ) : null}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                side={open ? "top" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                      <AvatarFallback className="rounded-lg">
                        {toInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <NavLink to={storefrontPaths.accountSection("profile")}>
                      <BadgeCheck className="size-4" />
                      <span>Account</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to={storefrontPaths.accountSection("support")}>
                      <Headphones className="size-4" />
                      <span>Support</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="size-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    void customerAuth.logout().then(() => navigate(storefrontPaths.home()))
                  }}
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
