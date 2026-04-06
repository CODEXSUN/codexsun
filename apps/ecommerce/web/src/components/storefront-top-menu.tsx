import {
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  Gift,
  Headphones,
  Heart,
  House,
  LayoutGrid,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MoonStar,
  Package,
  ShoppingCart,
  Store,
  SunMedium,
  TrendingUp,
  UserRound,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"

import { useAuth } from "@cxapp/web/src/auth/auth-context"
import {
  isCustomerSurfaceUser,
  resolveAuthenticatedHomePath,
} from "@cxapp/web/src/auth/auth-surface"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { Dock, DockIcon } from "@/registry/magicui/dock"
import { cn } from "@ui/lib/utils"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
import { useStorefrontCustomerPortal } from "../hooks/use-storefront-customer-portal"
import { useStorefrontShellData } from "../hooks/use-storefront-shell-data"
import { storefrontPaths } from "../lib/storefront-routes"
import { StorefrontSearchBar } from "./storefront-search-bar"

type ThemeMode = "light" | "dark" | "system"
type AccentTheme = "neutral" | "orange" | "blue" | "green" | "purple"

const appearanceModes: ThemeMode[] = ["light", "dark", "system"]
const accentThemes: AccentTheme[] = ["neutral", "orange", "blue", "green", "purple"]

function getPreferredThemeMode() {
  if (typeof window === "undefined") {
    return "system"
  }

  const storedTheme = window.localStorage.getItem("codexsun-theme-mode")

  if (storedTheme === "dark" || storedTheme === "light" || storedTheme === "system") {
    return storedTheme
  }

  return "system"
}

function getPreferredAccentTheme() {
  if (typeof window === "undefined") {
    return "neutral"
  }

  const storedAccent = window.localStorage.getItem("codexsun-theme-accent")

  if (
    storedAccent === "neutral" ||
    storedAccent === "orange" ||
    storedAccent === "blue" ||
    storedAccent === "green" ||
    storedAccent === "purple"
  ) {
    return storedAccent
  }

  return "neutral"
}

function resolveDarkMode(mode: ThemeMode) {
  if (mode === "dark") {
    return true
  }

  if (mode === "light") {
    return false
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyTheme(mode: ThemeMode, accent: AccentTheme) {
  const isDarkMode = resolveDarkMode(mode)

  document.documentElement.classList.toggle("dark", isDarkMode)
  document.documentElement.dataset.accent = accent
}

function StorefrontThemeMenu() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system")
  const [accentTheme, setAccentTheme] = useState<AccentTheme>("neutral")

  useEffect(() => {
    const preferredThemeMode = getPreferredThemeMode()
    const preferredAccentTheme = getPreferredAccentTheme()

    setThemeMode(preferredThemeMode)
    setAccentTheme(preferredAccentTheme)
    applyTheme(preferredThemeMode, preferredAccentTheme)
  }, [])

  useEffect(() => {
    if (themeMode !== "system") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => {
      applyTheme("system", accentTheme)
    }

    mediaQuery.addEventListener("change", sync)

    return () => {
      mediaQuery.removeEventListener("change", sync)
    }
  }, [accentTheme, themeMode])

  function setAppearanceMode(mode: ThemeMode) {
    setThemeMode(mode)
    window.localStorage.setItem("codexsun-theme-mode", mode)
    applyTheme(mode, accentTheme)
  }

  function setAccentMode(accent: AccentTheme) {
    setAccentTheme(accent)
    window.localStorage.setItem("codexsun-theme-accent", accent)
    applyTheme(themeMode, accent)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-11 rounded-full border-[#ddd4c9] bg-white/88 text-[#2b241f] shadow-[0_16px_30px_-24px_rgba(58,34,18,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.06] hover:border-[#111111] hover:bg-[#111111] hover:text-white active:scale-[0.97] data-[state=open]:border-[#111111] data-[state=open]:bg-[#111111] data-[state=open]:text-white"
        >
          {themeMode === "dark" ? <MoonStar className="size-5" /> : <SunMedium className="size-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-[1.35rem] border-[#e2ddd6] bg-white p-0 shadow-[0_22px_44px_-26px_rgba(44,26,14,0.35)]"
      >
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#241913]">
            Appearance
          </p>
        </div>
        <div className="pb-2">
          {appearanceModes.map((mode) => (
            <DropdownMenuItem
              key={mode}
              className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
              onSelect={() => {
                setAppearanceMode(mode)
              }}
            >
              <span className="capitalize">{mode}</span>
              {themeMode === mode ? <Check className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#241913]">
            Accent
          </p>
        </div>
        <div className="pb-2">
          {accentThemes.map((accent) => (
            <DropdownMenuItem
              key={accent}
              className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
              onSelect={() => {
                setAccentMode(accent)
              }}
            >
              <span className="capitalize">{accent}</span>
              {accentTheme === accent ? <Check className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function StorefrontTopMenu({
  isScrolled,
}: {
  isScrolled: boolean
}) {
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
  const mobileDockButtonClassName = cn(
    buttonVariants({ variant: "ghost", size: "icon-lg" }),
    "relative flex h-14 w-full items-center justify-center rounded-[1.15rem] border border-transparent bg-transparent px-0 text-[#5c5147] shadow-none transition-all duration-200 hover:bg-[#f4ece3] hover:text-[#241913]"
  )
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

  return (
    <>
      <div
        className={`border-b border-[#ece7df]/90 transition-all duration-300 ${
          isScrolled
            ? "bg-[#fbfaf7]/80 shadow-[0_22px_52px_-30px_rgba(34,22,13,0.5)] backdrop-blur-xl"
            : "bg-[#fbfaf7]/96 shadow-[0_14px_28px_-24px_rgba(34,22,13,0.24)] backdrop-blur-xl"
        }`}
      >
        <div
          className={`flex w-full min-w-0 flex-col gap-3 overflow-x-clip px-4 transition-all duration-300 sm:px-6 lg:px-8 xl:px-10 ${
            isScrolled ? "py-2.5" : "py-3.5"
          }`}
        >
          <div className="flex items-center gap-2 lg:hidden">
            <Link to={storefrontPaths.home()} className="min-w-0 shrink-0">
              <div className="flex items-center gap-2 rounded-full pr-1">
                <img
                  src="/logo.svg"
                  alt={brand?.brandName ?? "Codexsun Store"}
                  className="h-9 w-auto shrink-0"
                />
                <div className="hidden min-w-0 min-[360px]:block">
                  <p className="truncate text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[#181818]">
                    {brand?.brandName ?? "Codexsun Store"}
                  </p>
                </div>
              </div>
            </Link>
            {showSearch ? (
              <div className="min-w-0 flex-1">
                <StorefrontSearchBar
                  className="w-full"
                  placeholder={settings?.search.placeholder}
                  departmentLabel={settings?.search.departmentLabel}
                  departments={settings?.search.departments}
                />
              </div>
            ) : null}
          </div>

          <div className="hidden lg:grid lg:grid-cols-[minmax(220px,1fr)_minmax(360px,1.25fr)_auto] lg:items-center lg:gap-5 xl:grid-cols-[minmax(240px,1fr)_minmax(420px,820px)_auto] xl:gap-6">
            <Link to={storefrontPaths.home()} className="min-w-0 shrink-0">
              <div className="flex items-center gap-3 rounded-full px-1 py-1">
                <img
                  src="/logo.svg"
                  alt={brand?.brandName ?? "Codexsun Store"}
                  className="h-11 w-auto shrink-0 xl:h-12"
                />
                <div className="flex min-w-0 flex-col justify-center leading-none">
                  <p className="truncate text-[1.15rem] font-semibold uppercase tracking-[0.2em] text-[#181818] xl:text-[1.4rem]">
                    {brand?.brandName ?? "Codexsun Store"}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.18em] text-[#a39689]">
                    {brand?.tagline ?? "Smart IT. Trusted value."}
                  </p>
                </div>
              </div>
            </Link>

            {showSearch ? (
              <div className="min-w-0">
                <StorefrontSearchBar
                  className="mx-auto w-full"
                  placeholder={settings?.search.placeholder}
                  departmentLabel={settings?.search.departmentLabel}
                  departments={settings?.search.departments}
                />
              </div>
            ) : (
              <div />
            )}

            <div className="flex min-w-0 items-center justify-end gap-2 xl:gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#ece3d9] bg-white/62 px-1.5 py-1 shadow-[0_16px_28px_-26px_rgba(58,34,18,0.35)]">
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className={cn(
                    "relative size-11 rounded-full border-[#ddd4c9] bg-white/90 text-[#534a42] shadow-[0_16px_30px_-24px_rgba(58,34,18,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.08] hover:border-[#111111] hover:bg-white hover:text-[#111111] active:scale-[0.97]"
                  )}
                >
                  <Link
                    to={
                      auth.isAuthenticated && isCustomerUser
                        ? storefrontPaths.accountSection("wishlist")
                        : storefrontPaths.accountLogin(storefrontPaths.accountSection("wishlist"))
                    }
                  >
                    <Heart
                      className={cn(
                        "size-5 transition-colors duration-200",
                        (isWishlistActive || wishlistCount > 0) && "fill-[#8b5e34] text-[#8b5e34]"
                      )}
                    />
                    {wishlistCount > 0 ? (
                      <Badge className="absolute -right-1 -top-1 min-w-5 rounded-full border border-white bg-[#8b5e34] px-1 text-[10px] text-white shadow-[0_10px_18px_-12px_rgba(139,94,52,0.9)]">
                        {wishlistCount}
                      </Badge>
                    ) : null}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className={cn(
                    "relative size-11 rounded-full border-[#ddd4c9] bg-white/90 text-[#534a42] shadow-[0_16px_30px_-24px_rgba(58,34,18,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.08] hover:border-[#111111] hover:bg-white hover:text-[#111111] active:scale-[0.97]"
                  )}
                >
                  <Link to={storefrontPaths.cart()}>
                    <ShoppingCart
                      className={cn(
                        "size-5 transition-colors duration-200",
                        isCartActive && "fill-[#8b5e34] text-[#8b5e34]"
                      )}
                    />
                    {cartCount > 0 ? (
                      <Badge className="absolute -right-1 -top-1 min-w-5 rounded-full border border-white bg-[#111111] px-1 text-[10px] text-white shadow-[0_10px_18px_-12px_rgba(17,17,17,0.9)]">
                        {cartCount}
                      </Badge>
                    ) : null}
                  </Link>
                </Button>
              </div>

              <div className="flex min-w-0 items-center gap-2 xl:gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      className="h-11 rounded-full border border-[#ddd4c9] bg-white px-4 font-semibold text-[#1f1a16] shadow-[0_22px_36px_-24px_rgba(58,34,18,0.38)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white hover:shadow-[0_26px_40px_-24px_rgba(139,94,52,0.7)] active:translate-y-0 active:scale-[0.96] active:bg-[#6f4a29] data-[state=open]:border-[#8b5e34] data-[state=open]:bg-[#8b5e34] data-[state=open]:text-white [&_svg:last-child]:transition-transform [&_svg:last-child]:duration-200 data-[state=open]:[&_svg:last-child]:rotate-180"
                    >
                      <UserRound className="size-5" />
                      <span className="hidden xl:inline">
                        {customerAuth.isAuthenticated ? "Account" : "Login"}
                      </span>
                      <ChevronDown className="size-4 text-current" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 rounded-[1.35rem] border-[#e2ddd6] bg-white p-0 shadow-[0_22px_44px_-26px_rgba(44,26,14,0.35)]"
                  >
                    <div className="px-4 py-4">
                      <p className="text-[1.02rem] font-semibold text-[#241913]">
                        {auth.isAuthenticated ? "Account Menu" : "Welcome Back"}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                    {!auth.isAuthenticated ? (
                      <>
                        <div className="flex items-center justify-between px-4 py-4">
                          <span className="text-sm text-[#757575]">New customer?</span>
                          <Link
                            to={storefrontPaths.accountRegister()}
                            className="text-sm font-semibold text-[#241913] hover:text-[#8b5e34]"
                          >
                            Sign Up
                          </Link>
                        </div>
                        <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                        <div className="p-2">
                          <DropdownMenuItem
                            asChild
                            className="rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
                          >
                            <Link to={storefrontPaths.accountLogin(storefrontPaths.account())}>
                              <LogIn className="size-4" />
                              <span>Sign In</span>
                            </Link>
                          </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                      </>
                    ) : null}
                    <div className="py-2">
                      {accountMenuItems.map((item) => (
                        <DropdownMenuItem
                          key={item.key}
                          asChild
                          className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
                        >
                          <Link to={item.href}>
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    {auth.isAuthenticated ? (
                      <>
                        <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                        <div className="p-2">
                          <DropdownMenuItem
                            asChild
                            className="rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
                          >
                            <Link to={authenticatedHomePath}>
                              {isCustomerUser ? <UserRound className="size-4" /> : <LayoutDashboard className="size-4" />}
                              <span>{isCustomerUser ? "My Portal" : "Dashboard"}</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl px-3 py-3 text-[15px] text-[#8b3b2d] focus:bg-[#fdf0ec] focus:text-[#8b3b2d]"
                            onSelect={() => {
                              void auth.logout()
                            }}
                          >
                            <LogOut className="size-4 text-current" />
                            <span>Logout</span>
                          </DropdownMenuItem>
                        </div>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 rounded-full border border-transparent bg-transparent px-3 text-[#5c5147] shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-transparent hover:text-[#8b5e34] active:translate-y-0 active:scale-[0.98] active:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-[#8b5e34] [&_svg:last-child]:transition-transform [&_svg:last-child]:duration-200 data-[state=open]:[&_svg:last-child]:rotate-180"
                    >
                      <span className="hidden xl:inline">More</span>
                      <ChevronDown className="size-4 text-current" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 rounded-[1.35rem] border-[#e2ddd6] bg-white p-0 shadow-[0_22px_44px_-26px_rgba(44,26,14,0.35)]"
                  >
                    <div className="px-4 py-4">
                      <p className="text-[1.02rem] font-semibold text-[#241913]">
                        Explore More Options
                      </p>
                    </div>
                    <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                    <div className="py-2">
                      {moreMenuItems.map((item) => (
                        <DropdownMenuItem
                          key={item.key}
                          asChild
                          className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
                        >
                          <Link to={item.href}>
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <StorefrontThemeMenu />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e7dbcf] bg-[#fbfaf7]/96 px-0 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 shadow-[0_-18px_38px_-28px_rgba(34,22,13,0.45)] backdrop-blur-xl lg:hidden">
        <TooltipProvider>
          <Dock
            direction="middle"
            className="w-full justify-between gap-1 rounded-none border-x-0 border-b-0 border-t-0 px-2 pb-0 pt-0.5 shadow-none"
          >
            {mobileDockItems.map((item) => (
              <DockIcon key={item.key} className="min-w-0 flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      aria-label={item.label}
                      className={cn(
                        mobileDockButtonClassName,
                        item.isActive && "border-[#1f1813] bg-[#1f1813] text-white"
                      )}
                    >
                      <item.icon className="size-[1.35rem]" />
                      {item.badgeCount > 0 ? (
                        <Badge className="absolute -right-1 -top-1 min-w-4 rounded-full border border-white bg-[#8b5e34] px-1 text-[9px] text-white shadow-[0_10px_18px_-12px_rgba(139,94,52,0.9)]">
                          {item.badgeCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={10}>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            ))}
            <DockIcon className="min-w-0 flex-1">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Menu"
                        className={cn(
                          mobileDockButtonClassName,
                          isAccountActive && "border-[#1f1813] bg-[#1f1813] text-white"
                        )}
                      >
                        <Menu className="size-[1.4rem]" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={10}>
                    <p>Menu</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  className="mb-3 w-72 rounded-[1.35rem] border-[#e2ddd6] bg-white p-0 shadow-[0_22px_44px_-26px_rgba(44,26,14,0.35)]"
                >
                  <div className="px-4 py-4">
                    <p className="text-[1.02rem] font-semibold text-[#241913]">
                      {auth.isAuthenticated ? "Account & More" : "Menu"}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                  {!auth.isAuthenticated ? (
                    <>
                      <div className="flex items-center justify-between px-4 py-4">
                        <span className="text-sm text-[#757575]">New customer?</span>
                        <Link
                          to={storefrontPaths.accountRegister()}
                          className="text-sm font-semibold text-[#241913] hover:text-[#8b5e34]"
                        >
                          Sign Up
                        </Link>
                      </div>
                      <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                      <div className="p-2">
                        <DropdownMenuItem
                          asChild
                          className="rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
                        >
                          <Link to={storefrontPaths.accountLogin(storefrontPaths.account())}>
                            <LogIn className="size-4" />
                            <span>Sign In</span>
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                    </>
                  ) : null}
                  <div className="py-2">
                    {accountMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item.key}
                        asChild
                        className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
                      >
                        <Link to={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                  <div className="py-2">
                    {moreMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item.key}
                        asChild
                        className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
                      >
                        <Link to={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  {auth.isAuthenticated ? (
                    <>
                      <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                      <div className="p-2">
                        <DropdownMenuItem
                          asChild
                          className="rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
                        >
                          <Link to={authenticatedHomePath}>
                            {isCustomerUser ? <UserRound className="size-4" /> : <LayoutDashboard className="size-4" />}
                            <span>{isCustomerUser ? "My Portal" : "Dashboard"}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-xl px-3 py-3 text-[15px] text-[#8b3b2d] focus:bg-[#fdf0ec] focus:text-[#8b3b2d]"
                          onSelect={() => {
                            void auth.logout()
                          }}
                        >
                          <LogOut className="size-4 text-current" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </div>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </DockIcon>
          </Dock>
        </TooltipProvider>
      </div>
    </>
  )
}
