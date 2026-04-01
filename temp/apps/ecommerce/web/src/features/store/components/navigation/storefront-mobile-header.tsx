import {
  BellIcon,
  ContactIcon,
  HeadphonesIcon,
  LayoutDashboardIcon,
  LogInIcon,
  PackageIcon,
  UserCircle2Icon,
} from "lucide-react"
import { Link } from "react-router-dom"

import { useAuth } from "@framework-core/web/auth/components/auth-provider"
import { buildCustomerPortalPath, getPortalHomeHref } from "@framework-core/web/auth/lib/portal-routing"
import { BrandMark } from "@/shared/branding/brand-mark"
import { StorefrontMobileMenu } from "@/features/store/components/navigation/storefront-mobile-menu"
import { StorefrontSearchBar } from "@/features/store/components/navigation/storefront-search-bar"
import { useStorefront } from "@/features/store/context/storefront-context"

type MobileHeaderCategory = {
  label: string
  slug: string
}

export function StorefrontMobileHeader({ categories }: { categories: MobileHeaderCategory[] }) {
  const auth = useAuth()
  const { wishlistProductIds, cartCount } = useStorefront()

  const drawerLinks = auth.isAuthenticated
    ? [
        { title: "Dashboard", url: getPortalHomeHref(auth.session?.user), icon: LayoutDashboardIcon },
        { title: "My Profile", url: buildCustomerPortalPath("/profile"), icon: UserCircle2Icon },
        { title: "Orders", url: buildCustomerPortalPath("/orders"), icon: PackageIcon },
        { title: "Notifications", url: buildCustomerPortalPath("/notifications"), icon: BellIcon },
        { title: "Support", url: buildCustomerPortalPath("/support"), icon: HeadphonesIcon },
        { title: "Contact Team", url: "/contact", icon: ContactIcon },
      ]
    : [
        { title: "Sign In", url: "/login", icon: LogInIcon },
        { title: "Create Account", url: "/register", icon: UserCircle2Icon },
        { title: "Support", url: "/contact", icon: HeadphonesIcon },
        { title: "Contact Team", url: "/contact", icon: ContactIcon },
      ]

  return (
    <div className="border-b border-border/60 lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Go to storefront home" className="min-w-0">
          <BrandMark compact />
        </Link>

        <StorefrontMobileMenu
          title="Store menu"
          description="Browse account shortcuts, saved items, and catalog entry points."
          links={drawerLinks}
          categories={categories.slice(0, 8)}
          wishlistCount={wishlistProductIds.length}
          cartCount={cartCount}
          side="right"
        />
      </div>

      <div className="px-4 pb-3 sm:px-6">
        <StorefrontSearchBar className="w-full" />
      </div>
    </div>
  )
}
