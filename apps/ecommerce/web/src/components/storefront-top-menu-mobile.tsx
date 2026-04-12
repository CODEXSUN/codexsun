import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, UserRound } from "lucide-react"
import { Link } from "react-router-dom"

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
import { resolveRuntimeBrandLogoUrl } from "@/features/branding/runtime-brand-logo"
import { Dock, DockIcon } from "@/registry/magicui/dock"
import { cn } from "@ui/lib/utils"

import { StorefrontSearchBar } from "./storefront-search-bar"
import { StorefrontTechnicalNameBadge } from "./storefront-technical-name-badge"
import type { StorefrontTopMenuProps } from "./storefront-top-menu-shared"
import { useStorefrontTopMenuModel } from "./storefront-top-menu-shared"

export function StorefrontTopMenuMobile({ isScrolled }: StorefrontTopMenuProps) {
  const {
    accountMenuItems,
    auth,
    authenticatedHomePath,
    brand,
    customerAuth,
    isAccountActive,
    isCustomerUser,
    mobileDockItems,
    moreMenuItems,
    settings,
    showSearch,
  } = useStorefrontTopMenuModel()
  const logoUrl = resolveRuntimeBrandLogoUrl(brand)

  const mobileDockButtonClassName = cn(
    buttonVariants({ variant: "ghost", size: "icon-lg" }),
    "relative flex h-14 w-full items-center justify-center rounded-[1.15rem] border border-transparent bg-transparent px-0 text-[#5c5147] shadow-none transition-all duration-200 hover:bg-[#f4ece3] hover:text-[#241913]"
  )

  return (
    <>
      <div
        className={`relative border-b border-[#ece7df]/90 transition-all duration-300 lg:hidden ${
          isScrolled
            ? "bg-[#fbfaf7]/80 shadow-[0_22px_52px_-30px_rgba(34,22,13,0.5)] backdrop-blur-xl"
            : "bg-[#fbfaf7]/96 shadow-[0_14px_28px_-24px_rgba(34,22,13,0.24)] backdrop-blur-xl"
        }`}
        data-technical-name="shell.storefront.top-menu"
        data-shell-mode="mobile"
      >
        <StorefrontTechnicalNameBadge
          name="shell.storefront.top-menu"
          className="right-4 top-3"
        />
        <div className={`flex w-full min-w-0 flex-col gap-3 overflow-x-clip px-4 transition-all duration-300 sm:px-6 ${isScrolled ? "py-2.5" : "py-3.5"}`}>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link to="/" className="min-w-0 flex-1">
              <div className="flex items-center gap-2 rounded-full pr-1">
                <img src={logoUrl} alt={brand?.brandName ?? "Codexsun Store"} className="h-9 w-auto shrink-0" />
                <div className="hidden min-w-0 min-[360px]:block">
                  <p className="truncate text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[#181818]">
                    {brand?.brandName ?? "Codexsun Store"}
                  </p>
                </div>
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="h-10 shrink-0 rounded-full border border-[#ddd4c9] bg-white px-3 text-[#1f1a16] shadow-[0_18px_30px_-24px_rgba(58,34,18,0.38)] transition-all duration-200 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white"
                >
                  <UserRound className="size-4" />
                  <span className="text-xs font-semibold">
                    {customerAuth.isAuthenticated ? "Account" : "Login"}
                  </span>
                  <ChevronDown className="size-3.5 text-current" />
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
                        to="/account/register"
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
                          {isCustomerUser ? (
                            <UserRound className="size-4" />
                          ) : (
                            <LayoutDashboard className="size-4" />
                          )}
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
          </div>
          {showSearch ? (
            <div className="-mx-4 min-w-0 sm:-mx-6">
              <div className="w-full px-4 sm:px-6">
                <StorefrontSearchBar
                  className="w-full"
                  placeholder={settings?.search.placeholder}
                  departmentLabel={settings?.search.departmentLabel}
                  departments={settings?.search.departments}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e7dbcf] bg-[#fbfaf7]/96 px-0 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 shadow-[0_-18px_38px_-28px_rgba(34,22,13,0.45)] backdrop-blur-xl lg:hidden">
        <TooltipProvider>
          <Dock direction="middle" className="w-full justify-between gap-1 rounded-none border-x-0 border-b-0 border-t-0 px-2 pb-0 pt-0.5 shadow-none">
            {mobileDockItems.map((item) => (
              <DockIcon key={item.key} className="min-w-0 flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={item.href} aria-label={item.label} className={cn(mobileDockButtonClassName, item.isActive && "border-[#1f1813] bg-[#1f1813] text-white")}>
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
                      <button type="button" aria-label="Menu" className={cn(mobileDockButtonClassName, isAccountActive && "border-[#1f1813] bg-[#1f1813] text-white")}>
                        <Menu className="size-[1.4rem]" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={10}>
                    <p>Menu</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" side="top" className="mb-3 w-72 rounded-[1.35rem] border-[#e2ddd6] bg-white p-0 shadow-[0_22px_44px_-26px_rgba(44,26,14,0.35)]">
                  <div className="px-4 py-4">
                    <p className="text-[1.02rem] font-semibold text-[#241913]">{auth.isAuthenticated ? "Account & More" : "Menu"}</p>
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
            </DockIcon>
          </Dock>
        </TooltipProvider>
      </div>
    </>
  )
}
