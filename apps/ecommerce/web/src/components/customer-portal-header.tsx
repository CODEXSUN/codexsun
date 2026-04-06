import { Bell, Home, LogOut, Package, Gift, TicketPercent, Sparkles } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { ThemeToggle } from "@/components/ux/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCustomerPortal } from "../hooks/use-storefront-customer-portal"
import type { PortalSectionId } from "../lib/customer-portal"
import { storefrontPaths } from "../lib/storefront-routes"

const sectionLabelMap: Record<PortalSectionId, string> = {
  overview: "Overview",
  profile: "Profile",
  wishlist: "Wishlist",
  cart: "Cart",
  checkout: "Checkout",
  orders: "Orders",
  support: "Support",
  coupons: "Coupons",
  "gift-cards": "Gift Cards",
  rewards: "Rewards",
}

export function CustomerPortalHeader({
  activeSection,
}: {
  activeSection: PortalSectionId
}) {
  const navigate = useNavigate()
  const customerAuth = useStorefrontCustomerAuth()
  const customerPortal = useStorefrontCustomerPortal()
  const portal = customerPortal.portalQuery.data
  const orders = customerPortal.ordersQuery.data?.items ?? []
  const latestOrder = orders[0] ?? null
  const notificationItems = [
    latestOrder
      ? {
          key: "order",
          label: latestOrder.orderNumber,
          summary: `Order status: ${latestOrder.status.replaceAll("_", " ")}`,
          href: storefrontPaths.accountOrder(latestOrder.id),
          icon: Package,
        }
      : null,
    (portal?.stats.activeCouponCount ?? 0) > 0
      ? {
          key: "coupons",
          label: "Coupons available",
          summary: `${portal?.stats.activeCouponCount ?? 0} active offers ready to use`,
          href: storefrontPaths.accountSection("coupons"),
          icon: TicketPercent,
        }
      : null,
    (portal?.stats.activeGiftCardCount ?? 0) > 0
      ? {
          key: "gift-cards",
          label: "Gift cards ready",
          summary: `${portal?.stats.activeGiftCardCount ?? 0} gift card balances available`,
          href: storefrontPaths.accountSection("gift-cards"),
          icon: Gift,
        }
      : null,
    portal?.rewards.pointsBalance
      ? {
          key: "rewards",
          label: "Rewards balance",
          summary: `${portal.rewards.pointsBalance} points available in your account`,
          href: storefrontPaths.accountSection("rewards"),
          icon: Sparkles,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string
    label: string
    summary: string
    href: string
    icon: typeof Package
  }>

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="hidden h-5 md:block" />
          <div className="flex min-w-0 items-center">
            <h1 className="truncate text-lg font-semibold text-foreground">
              {sectionLabelMap[activeSection]}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative size-9 px-0">
                <Bell className="size-4" />
                {notificationItems.length > 0 ? (
                  <Badge className="absolute -right-1 -top-1 min-w-4 rounded-full px-1 text-[9px]">
                    {notificationItems.length}
                  </Badge>
                ) : null}
                <span className="sr-only">Open notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
              <DropdownMenuLabel className="px-2 pb-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificationItems.length > 0 ? (
                notificationItems.map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    asChild
                    className="rounded-xl px-3 py-3"
                  >
                    <Link to={item.href} className="grid min-w-0 grid-cols-[auto_1fr] items-start gap-3">
                      <item.icon className="mt-0.5 size-4" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.summary}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-muted-foreground">
                  No new notifications.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" asChild>
            <Link to={storefrontPaths.home()}>
              <Home className="size-4" />
              Home
            </Link>
          </Button>
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void customerAuth.logout().then(() => navigate(storefrontPaths.home()))
            }}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
