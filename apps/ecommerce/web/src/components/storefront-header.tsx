import {
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  Gift,
  Headphones,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  MoonStar,
  Package,
  Store,
  ShoppingCart,
  SunMedium,
  TrendingUp,
  UserRound,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { useAuth } from "@cxapp/web/src/auth/auth-context"
import {
  isCustomerSurfaceUser,
  resolveAuthenticatedHomePath,
} from "@cxapp/web/src/auth/auth-surface"
import { cn } from "@ui/lib/utils"
import { useLocation } from "react-router-dom"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
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

export function StorefrontHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isWishlistActive, setIsWishlistActive] = useState(false)
  const location = useLocation()
  const { brand } = useRuntimeBrand()
  const customerAuth = useStorefrontCustomerAuth()
  const auth = useAuth()
  const authenticatedHomePath = resolveAuthenticatedHomePath(auth.user)
  const { data } = useStorefrontShellData()
  const settings = data?.settings
  const cart = useStorefrontCart()
  const cartCount = cart.itemCount
  const isCartActive = location.pathname === storefrontPaths.cart()

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 8)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const accountMenuItems = [
    {
      key: "profile",
      label: "My Profile",
      href:
        auth.isAuthenticated && isCustomerSurfaceUser(auth.user)
          ? storefrontPaths.account()
          : storefrontPaths.accountLogin(storefrontPaths.account()),
      icon: UserRound,
    },
    {
      key: "orders",
      label: "Orders",
      href:
        auth.isAuthenticated && isCustomerSurfaceUser(auth.user)
          ? storefrontPaths.account()
          : storefrontPaths.accountLogin(storefrontPaths.account()),
      icon: Package,
    },
    {
      key: "wishlist",
      label: "Wishlist",
      href: storefrontPaths.catalog(),
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
      href: storefrontPaths.home(),
      icon: Gift,
    },
    {
      key: "gift-cards",
      label: "Gift Cards",
      href: storefrontPaths.home(),
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
        auth.isAuthenticated && isCustomerSurfaceUser(auth.user)
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

  return (
    <header
      className={`sticky top-0 z-40 border-b border-[#ece7df]/90 backdrop-blur-xl transition-all duration-300 ${
        isScrolled
          ? "bg-[#fbfaf7]/80 shadow-[0_22px_52px_-30px_rgba(34,22,13,0.5)]"
          : "bg-[#fbfaf7]/96 shadow-[0_14px_28px_-24px_rgba(34,22,13,0.24)]"
      }`}
    >
      <div
        className={`grid w-full grid-cols-1 items-center gap-3 px-4 transition-all duration-300 sm:px-6 lg:grid-cols-[minmax(240px,1fr)_minmax(620px,840px)_minmax(320px,1fr)] lg:gap-6 lg:px-10 ${
          isScrolled ? "py-2.5" : "py-3.5"
        }`}
      >
        <Link to={storefrontPaths.home()} className="min-w-0 shrink-0 justify-self-start">
          <div className="flex items-center gap-3 rounded-full px-1 py-1">
            <img
              src="/logo.svg"
              alt={brand?.brandName ?? "Codexsun Store"}
              className="h-11 w-auto shrink-0 lg:h-12"
            />
            <div className="flex min-w-0 flex-col justify-center leading-none">
              <p className="truncate text-[1.2rem] font-semibold uppercase tracking-[0.22em] text-[#181818] sm:text-[1.35rem] lg:text-[1.5rem]">
                {brand?.brandName ?? "Codexsun Store"}
              </p>
              <p className="mt-1 hidden truncate text-[10px] font-medium uppercase tracking-[0.18em] text-[#a39689] sm:block">
                {brand?.tagline ?? "Smart IT. Trusted value."}
              </p>
            </div>
          </div>
        </Link>
        <div className="min-w-0 lg:justify-self-center lg:w-full">
          <StorefrontSearchBar
            className="mx-auto w-full max-w-[840px]"
            placeholder={settings?.search.placeholder}
            departmentLabel={settings?.search.departmentLabel}
            departments={settings?.search.departments}
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center justify-self-end gap-3">
          <div className="flex items-center gap-3 rounded-full border border-[#ece3d9] bg-white/62 px-1.5 py-1 shadow-[0_16px_28px_-26px_rgba(58,34,18,0.35)]">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "size-11 rounded-full border-[#ddd4c9] shadow-[0_16px_30px_-24px_rgba(58,34,18,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.08] hover:border-[#111111] active:scale-[0.97]",
                isWishlistActive
                  ? "bg-white/90 text-[#534a42] hover:bg-white hover:text-[#111111]"
                  : "bg-white/90 text-[#534a42] hover:bg-white hover:text-[#111111]"
              )}
              onClick={() => {
                setIsWishlistActive((current) => !current)
              }}
              aria-pressed={isWishlistActive}
            >
              <Heart
                className={cn(
                  "size-5 transition-colors duration-200",
                  isWishlistActive && "fill-[#8b5e34] text-[#8b5e34]"
                )}
              />
            </Button>
            <Button
              asChild
              variant="outline"
              size="icon"
              className={cn(
                "relative size-11 rounded-full border-[#ddd4c9] shadow-[0_16px_30px_-24px_rgba(58,34,18,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.08] hover:border-[#111111] active:scale-[0.97]",
                isCartActive
                  ? "bg-white/90 text-[#534a42] hover:bg-white hover:text-[#111111]"
                  : "bg-white/90 text-[#534a42] hover:bg-white hover:text-[#111111]"
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
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="h-11 rounded-full border border-[#ddd4c9] bg-white px-4 font-semibold text-[#1f1a16] shadow-[0_22px_36px_-24px_rgba(58,34,18,0.38)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white hover:shadow-[0_26px_40px_-24px_rgba(139,94,52,0.7)] active:translate-y-0 active:scale-[0.96] active:bg-[#6f4a29] data-[state=open]:border-[#8b5e34] data-[state=open]:bg-[#8b5e34] data-[state=open]:text-white [&_svg:last-child]:transition-transform [&_svg:last-child]:duration-200 data-[state=open]:[&_svg:last-child]:rotate-180"
                >
                  <UserRound className="size-5" />
                  <span>{customerAuth.isAuthenticated ? "Account" : "Login"}</span>
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
                        <LayoutDashboard className="size-4" />
                        <span>Dashboard</span>
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
                  <span>More</span>
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
          </div>
          <StorefrontThemeMenu />
        </div>
      </div>
    </header>
  )
}
