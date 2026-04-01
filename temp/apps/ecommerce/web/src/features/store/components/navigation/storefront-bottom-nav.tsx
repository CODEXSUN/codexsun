import { HeartIcon, HomeIcon, MenuIcon, ShoppingCartIcon, UserCircle2Icon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildCustomerPortalPath, getPortalHomeHref } from "@framework-core/web/auth/lib/portal-routing"
import { useAuth } from "@framework-core/web/auth/components/auth-provider"
import { StorefrontMobileMenu } from "@/features/store/components/navigation/storefront-mobile-menu"
import { useStorefront } from "@/features/store/context/storefront-context"
import { cn } from "@/lib/utils"

type BottomNavCategory = {
  label: string
  slug: string
}

export function StorefrontBottomNav({ categories }: { categories: BottomNavCategory[] }) {
  const location = useLocation()
  const auth = useAuth()
  const { wishlistProductIds, cartCount } = useStorefront()
  const items = [
    { label: "Home", url: "/", icon: HomeIcon, fillWhenHighlighted: false },
    { label: "Wishlist", url: "/wishlist", icon: HeartIcon, fillWhenHighlighted: true },
    { label: "Cart", url: "/cart", icon: ShoppingCartIcon, fillWhenHighlighted: true },
    { label: "Account", url: getPortalHomeHref(auth.session?.user), icon: UserCircle2Icon, fillWhenHighlighted: false },
  ]

  const drawerLinks = auth.isAuthenticated
    ? [
        { title: "Dashboard", url: getPortalHomeHref(auth.session?.user) },
        { title: "My Profile", url: buildCustomerPortalPath("/profile") },
        { title: "Orders", url: buildCustomerPortalPath("/orders") },
        { title: "Notifications", url: buildCustomerPortalPath("/notifications") },
        { title: "Support", url: buildCustomerPortalPath("/support") },
        { title: "Contact Team", url: "/contact" },
      ]
    : [
        { title: "Sign In", url: "/login" },
        { title: "Create Account", url: "/register" },
        { title: "Support", url: "/contact" },
        { title: "Contact Team", url: "/contact" },
      ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/96 px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-24px_rgba(40,28,18,0.32)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)
          const isWishlistItem = item.label === "Wishlist"
          const isCartItem = item.label === "Cart"
          const isAccountItem = item.label === "Account"
          const wishlistActive = isWishlistItem && wishlistProductIds.length > 0
          const cartActive = isCartItem && cartCount > 0
          const accountActive =
            isAccountItem &&
            (auth.isAuthenticated ||
              location.pathname === "/login" ||
              location.pathname === "/register" ||
              location.pathname.startsWith("/dashboard/") ||
              location.pathname === "/dashboard" ||
              location.pathname.startsWith("/admin/dashboard/") ||
              location.pathname === "/admin/dashboard" ||
              location.pathname.startsWith("/account/") ||
              location.pathname === "/account")
          const shouldHighlight = isActive || wishlistActive || cartActive || accountActive

          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "relative flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all duration-300 ease-out",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : wishlistActive
                    ? "bg-primary/[0.08] text-primary"
                    : cartActive
                      ? "bg-primary/[0.08] text-primary"
                    : accountActive
                      ? "bg-primary/[0.08] text-primary"
                    : "text-muted-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-all duration-300 ease-out",
                  shouldHighlight && item.fillWhenHighlighted ? "fill-current text-current" : "",
                )}
                strokeWidth={isWishlistItem || isCartItem || isAccountItem ? 1.9 : undefined}
              />
              {isWishlistItem && wishlistProductIds.length > 0 ? (
                <Badge className="absolute top-1 right-3 min-w-5 justify-center rounded-full px-1 text-[10px]">
                  {wishlistProductIds.length}
                </Badge>
              ) : null}
              {item.label === "Cart" && cartCount > 0 ? (
                <Badge className="absolute top-1 right-3 min-w-5 justify-center rounded-full px-1 text-[10px]">
                  {cartCount}
                </Badge>
              ) : null}
              <span>{item.label}</span>
            </Link>
          )
        })}

        <StorefrontMobileMenu
          title="Store menu"
          description="Browse account shortcuts, saved items, and category links."
          links={drawerLinks.map((link) => ({ ...link }))}
          categories={categories.slice(0, 8)}
          wishlistCount={wishlistProductIds.length}
          cartCount={cartCount}
          side="right"
          trigger={(
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "relative flex min-h-14 w-full touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition-all duration-300 ease-out hover:bg-accent hover:text-accent-foreground",
              )}
              aria-label="Open store menu"
            >
              <MenuIcon className="size-4" />
              <span>Menu</span>
            </Button>
          )}
        />
      </div>
    </nav>
  )
}
