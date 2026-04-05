import { Home } from "lucide-react"
import { Link } from "react-router-dom"

import { ThemeToggle } from "@/components/ux/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import type { PortalSectionId } from "../lib/customer-portal"
import { storefrontPaths } from "../lib/storefront-routes"

const sectionLabelMap: Record<PortalSectionId, string> = {
  overview: "Overview",
  profile: "Profile",
  wishlist: "Wishlist",
  cart: "Cart",
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
          <Button variant="outline" size="sm" asChild>
            <Link to={storefrontPaths.home()}>
              <Home className="size-4" />
              Home
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
