import {
  Bell,
  CreditCard,
  Gift,
  Headphones,
  Heart,
  House,
  LayoutGrid,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
  UserRound,
} from "lucide-react"
import { useLocation } from "react-router-dom"

import { useAuth } from "@cxapp/web/src/auth/auth-context"
import {
  isCustomerSurfaceUser,
  resolveAuthenticatedHomePath,
} from "@cxapp/web/src/auth/auth-surface"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
import { useStorefrontCustomerPortal } from "../hooks/use-storefront-customer-portal"
import { useStorefrontShellData } from "../hooks/use-storefront-shell-data"
import { storefrontPaths } from "../lib/storefront-routes"

export type StorefrontTopMenuProps = {
  isScrolled: boolean
}

export function useStorefrontTopMenuModel() {
  const location = useLocation()
  const { brand } = useRuntimeBrand()
  const customerAuth = useStorefrontCustomerAuth()
  const customerPortal = useStorefrontCustomerPortal()
  const auth = useAuth()
  const authenticatedHomePath = resolveAuthenticatedHomePath(auth.user)
  const isCustomerUser = isCustomerSurfaceUser(auth.user)
  const { data } = useStorefrontShellData()
  const settings = data?.settings
  const showSearch = Boolean(settings?.visibility.search)
  const cart = useStorefrontCart()
  const cartCount = cart.itemCount
  const isHomeActive = location.pathname === storefrontPaths.home()
  const isCatalogActive = location.pathname === storefrontPaths.catalog()
  const isCartActive = location.pathname === storefrontPaths.cart()
  const isWishlistActive = location.pathname === storefrontPaths.accountSection("wishlist")
  const isAccountActive = location.pathname.startsWith(storefrontPaths.account())
  const wishlistCount = customerPortal.wishlistCount

  const accountMenuItems = [
    {
      key: "profile",
      label: "My Profile",
      href:
        auth.isAuthenticated && isCustomerUser
          ? storefrontPaths.accountSection("profile")
          : storefrontPaths.accountLogin(storefrontPaths.accountSection("profile")),
      icon: UserRound,
    },
    {
      key: "orders",
      label: "Orders",
      href:
        auth.isAuthenticated && isCustomerUser
          ? storefrontPaths.accountSection("orders")
          : storefrontPaths.accountLogin(storefrontPaths.accountSection("orders")),
      icon: Package,
    },
    {
      key: "wishlist",
      label: "Wishlist",
      href:
        auth.isAuthenticated && isCustomerUser
          ? storefrontPaths.accountSection("wishlist")
          : storefrontPaths.accountLogin(storefrontPaths.accountSection("wishlist")),
      icon: Heart,
    },
    {
      key: "cart",
      label: "Cart",
      href: storefrontPaths.cart(),
      icon: ShoppingCart,
    },
    {
      key: "rewards",
      label: "Rewards",
      href:
        auth.isAuthenticated && isCustomerUser
          ? storefrontPaths.accountSection("rewards")
          : storefrontPaths.accountLogin(storefrontPaths.accountSection("rewards")),
      icon: Gift,
    },
    {
      key: "gift-cards",
      label: "Gift Cards",
      href:
        auth.isAuthenticated && isCustomerUser
          ? storefrontPaths.accountSection("gift-cards")
          : storefrontPaths.accountLogin(storefrontPaths.accountSection("gift-cards")),
      icon: CreditCard,
    },
  ] as const

  const moreMenuItems = [
    {
      key: "seller",
      label: "Become a Seller",
      href: storefrontPaths.home(),
      icon: Store,
    },
    {
      key: "notifications",
      label: "Notification Settings",
      href:
        auth.isAuthenticated && isCustomerUser
          ? storefrontPaths.account()
          : storefrontPaths.accountLogin(storefrontPaths.account()),
      icon: Bell,
    },
    {
      key: "care",
      label: "24x7 Customer Care",
      href: storefrontPaths.trackOrder(),
      icon: Headphones,
    },
    {
      key: "advertise",
      label: "Advertise",
      href: storefrontPaths.home(),
      icon: TrendingUp,
    },
    {
      key: "contact",
      label: "Contact Team",
      href: storefrontPaths.trackOrder(),
      icon: Headphones,
    },
  ] as const

  const mobileDockItems = [
    {
      key: "home",
      href: storefrontPaths.home(),
      icon: House,
      label: "Home",
      isActive: isHomeActive,
      badgeCount: 0,
    },
    {
      key: "catalog",
      href: storefrontPaths.catalog(),
      icon: LayoutGrid,
      label: "Catalog",
      isActive: isCatalogActive,
      badgeCount: 0,
    },
    {
      key: "wishlist",
      href:
        auth.isAuthenticated && isCustomerUser
          ? storefrontPaths.accountSection("wishlist")
          : storefrontPaths.accountLogin(storefrontPaths.accountSection("wishlist")),
      icon: Heart,
      label: "Wishlist",
      isActive: isWishlistActive,
      badgeCount: wishlistCount,
    },
    {
      key: "cart",
      href: storefrontPaths.cart(),
      icon: ShoppingCart,
      label: "Cart",
      isActive: isCartActive,
      badgeCount: cartCount,
    },
  ] as const

  return {
    accountMenuItems,
    auth,
    authenticatedHomePath,
    brand,
    cartCount,
    customerAuth,
    isAccountActive,
    isCartActive,
    isCustomerUser,
    isWishlistActive,
    mobileDockItems,
    moreMenuItems,
    settings,
    showSearch,
    wishlistCount,
  }
}
