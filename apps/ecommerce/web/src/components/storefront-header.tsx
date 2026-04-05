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
          className="size-10 rounded-full border-[#d8d8d8] bg-white text-[#1f1f1f] hover:border-[#111111] hover:bg-[#111111] hover:text-white data-[state=open]:border-[#111111] data-[state=open]:bg-[#111111] data-[state=open]:text-white"
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
  const { brand } = useRuntimeBrand()
  const customerAuth = useStorefrontCustomerAuth()
  const auth = useAuth()
  const authenticatedHomePath = resolveAuthenticatedHomePath(auth.user)
  const { data } = useStorefrontShellData()
  const settings = data?.settings
  const cart = useStorefrontCart()
  const cartCount = cart.itemCount

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
      className={`sticky top-0 z-40 border-b border-[#ece7df] backdrop-blur-md transition-colors ${
        isScrolled ? "bg-[#fbfaf7]/88" : "bg-[#fbfaf7]/98"
      }`}
    >
      <div className="flex w-full items-center gap-3 px-4 py-2.5 lg:px-5">
        <Link to={storefrontPaths.home()} className="min-w-0 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.svg"
              alt={brand?.brandName ?? "Codexsun Store"}
              className="h-10 w-auto shrink-0"
            />
            <div className="flex min-w-0 flex-col justify-center leading-none">
              <p className="truncate text-[1.55rem] font-semibold uppercase tracking-[0.2em] text-[#181818]">
                {brand?.brandName ?? "Codexsun Store"}
              </p>
              <p className="mt-0.5 truncate text-[12px] leading-none text-[#757575]">
                {brand?.tagline ?? "Smart IT. Trusted value."}
              </p>
            </div>
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <StorefrontSearchBar
            placeholder={settings?.search.placeholder}
            departmentLabel={settings?.search.departmentLabel}
            departments={settings?.search.departments}
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full border-[#d8d8d8] bg-white text-[#555555] hover:bg-[#f8f8f8] hover:text-[#1f1f1f]"
          >
            <Heart className="size-5" />
          </Button>
          <Button
            asChild
            variant="outline"
            size="icon"
            className="relative size-10 rounded-full border-[#d8d8d8] bg-white text-[#555555] hover:bg-[#f8f8f8] hover:text-[#1f1f1f]"
          >
            <Link to={storefrontPaths.cart()}>
              <ShoppingCart className="size-5" />
              {cartCount > 0 ? (
                <Badge className="absolute -right-1 -top-1 min-w-5 rounded-full px-1 text-[10px]">
                  {cartCount}
                </Badge>
              ) : null}
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 rounded-full border-[#d8d8d8] bg-white px-3.5 text-[#1f1f1f] hover:border-[#111111] hover:bg-[#111111] hover:text-white data-[state=open]:border-[#111111] data-[state=open]:bg-[#111111] data-[state=open]:text-white"
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
                  <DropdownMenuItem asChild className="rounded-none px-4 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]">
                    <Link to={storefrontPaths.accountLogin(storefrontPaths.account())}>
                      <LogIn className="size-4" />
                      <span>Sign In</span>
                    </Link>
                  </DropdownMenuItem>
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
                className="h-10 rounded-full border-[#d8d8d8] bg-white px-3.5 text-[#1f1f1f] hover:border-[#111111] hover:bg-[#111111] hover:text-white data-[state=open]:border-[#111111] data-[state=open]:bg-[#111111] data-[state=open]:text-white"
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
          <StorefrontThemeMenu />
        </div>
      </div>
    </header>
  )
}
