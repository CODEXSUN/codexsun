import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShoppingCart,
  UserRound,
} from "lucide-react"
import type { CSSProperties } from "react"
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
import { resolveRuntimeBrandLogoUrl } from "@/features/branding/runtime-brand-logo"
import { cn } from "@ui/lib/utils"

import { getMenuLogoFrameStyle, getMenuLogoImageStyle } from "../lib/storefront-menu-designer"
import { StorefrontSearchBar } from "./storefront-search-bar"
import { StorefrontTechnicalNameBadge } from "./storefront-technical-name-badge"
import { StorefrontThemeMenu } from "./storefront-theme-menu"
import type { StorefrontTopMenuProps } from "./storefront-top-menu-shared"
import { useStorefrontTopMenuModel } from "./storefront-top-menu-shared"

export function StorefrontTopMenuDesktop({ isScrolled }: StorefrontTopMenuProps) {
  const {
    accountMenuItems,
    auth,
    authenticatedHomePath,
    brand,
    cartCount,
    customerAuth,
    isCartActive,
    isCustomerUser,
    isWishlistActive,
    moreMenuItems,
    settings,
    showSearch,
    wishlistCount,
  } = useStorefrontTopMenuModel()
  const menuDesign = settings?.menuDesigner.topMenu
  const effectiveMenuDesign = menuDesign ?? {
    logoVariant: "primary",
    frameWidth: 92,
    frameHeight: 52,
    logoWidth: 92,
    logoHeight: 52,
    offsetX: 0,
    offsetY: 0,
    logoHoverColor: "#8b5e34",
    areaBackgroundColor: "#00000000",
    logoBackgroundColor: "#00000000",
  }
  const logoUrl = resolveRuntimeBrandLogoUrl(brand, effectiveMenuDesign.logoVariant)

  return (
    <div
      className={`relative border-b border-[#ece7df]/90 transition-all duration-300 ${
        isScrolled
          ? "bg-[#fbfaf7]/80 shadow-[0_22px_52px_-30px_rgba(34,22,13,0.5)] backdrop-blur-xl"
          : "bg-[#fbfaf7]/96 shadow-[0_14px_28px_-24px_rgba(34,22,13,0.24)] backdrop-blur-xl"
      }`}
      data-technical-name="shell.storefront.top-menu"
      data-shell-mode="desktop"
    >
      <StorefrontTechnicalNameBadge
        name="shell.storefront.top-menu"
        className="right-5 top-3"
      />
      <div
        className={`hidden w-full min-w-0 px-4 transition-all duration-300 sm:px-6 lg:grid lg:grid-cols-[minmax(220px,1fr)_minmax(360px,1.25fr)_auto] lg:items-center lg:gap-5 lg:px-8 xl:grid-cols-[minmax(240px,1fr)_minmax(420px,820px)_auto] xl:gap-6 xl:px-10 ${
          isScrolled ? "py-2.5" : "py-3.5"
        }`}
      >
        <Link
          to="/"
          className="group flex min-w-0 shrink-0"
          style={
            {
              "--storefront-logo-hover-color": effectiveMenuDesign.logoHoverColor,
            } as CSSProperties
          }
        >
          <div className="flex items-center gap-3 rounded-[1.35rem] px-1 py-1">
            <div
              className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem]"
              style={getMenuLogoFrameStyle(effectiveMenuDesign)}
            >
              <img
                src={logoUrl}
                alt={brand?.brandName ?? "Codexsun Store"}
                className="absolute object-contain transition-transform duration-200"
                style={getMenuLogoImageStyle(effectiveMenuDesign)}
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center leading-none">
              <p className="truncate text-[1.15rem] font-semibold uppercase tracking-[0.2em] text-[#181818] transition-colors duration-200 group-hover:text-[var(--storefront-logo-hover-color)] xl:text-[1.4rem]">
                {brand?.brandName ?? "Codexsun Store"}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.18em] text-[#a39689] transition-colors duration-200 group-hover:text-[var(--storefront-logo-hover-color)]">
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
              className="relative size-11 rounded-full border-[#ddd4c9] bg-white/90 text-[#534a42] shadow-[0_16px_30px_-24px_rgba(58,34,18,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.08] hover:border-[#111111] hover:bg-white hover:text-[#111111] active:scale-[0.97]"
            >
              <Link to={accountMenuItems[2].href}>
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
              className="relative size-11 rounded-full border-[#ddd4c9] bg-white/90 text-[#534a42] shadow-[0_16px_30px_-24px_rgba(58,34,18,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.08] hover:border-[#111111] hover:bg-white hover:text-[#111111] active:scale-[0.97]"
            >
              <Link to="/cart">
                <ShoppingCart
                  className={cn("size-5 transition-colors duration-200", isCartActive && "fill-[#8b5e34] text-[#8b5e34]")}
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
                  className="h-11 rounded-full border border-[#ddd4c9] bg-white px-4 font-semibold text-[#1f1a16] shadow-[0_22px_36px_-24px_rgba(58,34,18,0.38)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white"
                >
                  <UserRound className="size-5" />
                  <span className="hidden xl:inline">{customerAuth.isAuthenticated ? "Account" : "Login"}</span>
                  <ChevronDown className="size-4 text-current" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 rounded-[1.35rem] border-[#e2ddd6] bg-white p-0 shadow-[0_22px_44px_-26px_rgba(44,26,14,0.35)]">
                <div className="px-4 py-4">
                  <p className="text-[1.02rem] font-semibold text-[#241913]">{auth.isAuthenticated ? "Account Menu" : "Welcome Back"}</p>
                </div>
                <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                {!auth.isAuthenticated ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-4">
                      <span className="text-sm text-[#757575]">New customer?</span>
                      <Link to="/account/register" className="text-sm font-semibold text-[#241913] hover:text-[#8b5e34]">Sign Up</Link>
                    </div>
                    <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                    <div className="p-2">
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]">
                        <Link to="/account/login">
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
                    <DropdownMenuItem key={item.key} asChild className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]">
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
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]">
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
                <Button variant="outline" className="h-11 rounded-full border border-transparent bg-transparent px-3 text-[#5c5147] shadow-none transition-all duration-200 hover:text-[#8b5e34]">
                  <span className="hidden xl:inline">More</span>
                  <ChevronDown className="size-4 text-current" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 rounded-[1.35rem] border-[#e2ddd6] bg-white p-0 shadow-[0_22px_44px_-26px_rgba(44,26,14,0.35)]">
                <div className="px-4 py-4">
                  <p className="text-[1.02rem] font-semibold text-[#241913]">Explore More Options</p>
                </div>
                <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
                <div className="py-2">
                  {moreMenuItems.map((item) => (
                    <DropdownMenuItem key={item.key} asChild className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]">
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
  )
}
