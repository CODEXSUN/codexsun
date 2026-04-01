import {
  BellIcon,
  ChevronDownIcon,
  CreditCardIcon,
  GiftIcon,
  HeadphonesIcon,
  HeartIcon,
  LayoutDashboardIcon,
  LogInIcon,
  LogOutIcon,
  PackageIcon,
  ShoppingCartIcon,
  StoreIcon,
  TrendingUpIcon,
  UserCircle2Icon,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@framework-core/web/auth/components/auth-provider"
import { buildCustomerPortalPath, getPortalHomeHref } from "@framework-core/web/auth/lib/portal-routing"
import { BrandMark } from "@/shared/branding/brand-mark"
import { StorefrontSearchBar } from "@/features/store/components/navigation/storefront-search-bar"
import { ThemeSwitcher } from "@/shared/theme/theme-switcher"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { useStorefront } from "@/features/store/context/storefront-context"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function StorefrontHeader() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { wishlistProductIds, cartCount } = useStorefront()
  const wishlistCount = wishlistProductIds.length
  const cartItemsCount = cartCount
  const wishlistHasItems = wishlistCount > 0
  const wishlistRouteActive = location.pathname === "/wishlist" || location.pathname.startsWith("/wishlist/")
  const wishlistActive = wishlistHasItems || wishlistRouteActive
  const cartHasItems = cartItemsCount > 0
  const cartRouteActive = location.pathname === "/cart" || location.pathname.startsWith("/cart/")
  const cartActive = cartHasItems || cartRouteActive
  const authRouteActive = location.pathname === "/login" || location.pathname === "/register"
  const accountRouteActive =
    location.pathname === "/account" ||
    location.pathname.startsWith("/account/") ||
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/dashboard/") ||
    location.pathname === "/admin/dashboard" ||
    location.pathname.startsWith("/admin/dashboard/")
  const accountActive = auth.isAuthenticated || authRouteActive || accountRouteActive

  const handleLogout = () => {
    auth.logout()
    void navigate("/", { replace: true })
  }

  const dashboardHref = getPortalHomeHref(auth.session?.user)

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl lg:border-b lg:border-border/70">
      <div className="border-b border-border/60 px-4 py-3 sm:px-6 lg:hidden">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Go to storefront home" className="shrink-0">
            <BrandMark compact />
          </Link>
          <div className="min-w-0 flex-1">
            <StorefrontSearchBar className="w-full" />
          </div>
        </div>
      </div>

      <div className="hidden w-full items-center gap-3 px-4 py-3 sm:px-6 lg:flex">
        <Link to="/" className="shrink-0">
          <BrandMark compact />
        </Link>

        <div className="flex-1">
          <StorefrontSearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/wishlist"
            aria-label={wishlistActive ? `Wishlist, ${wishlistCount} saved items` : "Wishlist"}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "group relative rounded-full border !bg-transparent transition-all duration-300 ease-out hover:!bg-transparent active:!bg-transparent",
              wishlistActive
                ? "border-accent/25 text-accent"
                : "border-transparent text-muted-foreground hover:scale-105 hover:border-accent/25",
            )}
          >
            <HeartIcon
              className={cn(
                "size-5 transition-all duration-300 ease-out",
                wishlistActive
                  ? "fill-current stroke-current text-accent"
                  : "fill-transparent stroke-current text-current group-hover:scale-110 group-hover:fill-current group-hover:text-accent",
              )}
              strokeWidth={1.9}
            />
            {wishlistCount > 0 ? (
              <Badge className="absolute -top-1 -right-1 min-w-5 justify-center rounded-full border border-white/80 bg-primary px-1 text-[10px] text-primary-foreground shadow-sm">
                {wishlistCount}
              </Badge>
            ) : null}
          </Link>
          <Link
            to="/cart"
            aria-label={cartActive ? `Cart, ${cartItemsCount} items` : "Cart"}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "group relative rounded-full border !bg-transparent transition-all duration-300 ease-out hover:!bg-transparent active:!bg-transparent",
              cartActive
                ? "border-accent/25 text-accent"
                : "border-transparent text-muted-foreground hover:scale-105 hover:border-accent/25",
            )}
          >
            <ShoppingCartIcon
              className={cn(
                "size-5 transition-all duration-300 ease-out",
                cartActive
                  ? "fill-current stroke-current text-accent"
                  : "fill-transparent stroke-current text-current group-hover:scale-110 group-hover:fill-current group-hover:text-accent",
              )}
              strokeWidth={1.9}
            />
            {cartItemsCount > 0 ? (
              <Badge className="absolute -top-1 -right-1 min-w-5 justify-center rounded-full border border-white/80 bg-primary px-1 text-[10px] text-primary-foreground shadow-sm">
                {cartItemsCount}
              </Badge>
            ) : null}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "group cursor-pointer rounded-full border !bg-transparent px-3 transition-all duration-300 ease-out hover:!bg-accent hover:!text-accent-foreground active:!bg-transparent md:px-4",
                  accountActive
                    ? "border-accent/25 text-foreground"
                    : "border-transparent text-muted-foreground hover:scale-105 hover:border-transparent",
                  "data-[state=open]:border-transparent data-[state=open]:!bg-accent data-[state=open]:!text-accent-foreground",
                )}
              >
                <UserCircle2Icon
                  className={cn(
                    "size-5 transition-all duration-300 ease-out md:mr-2",
                    accountActive
                      ? "fill-transparent stroke-current text-accent group-hover:text-current group-data-[state=open]:text-current"
                      : "fill-transparent stroke-current text-current group-hover:scale-110 group-hover:text-current group-data-[state=open]:text-current",
                  )}
                  strokeWidth={1.9}
                />
                <span className="hidden md:inline-block">{auth.isAuthenticated ? "Account" : "Login"}</span>
                <ChevronDownIcon className="hidden size-4 transition-transform group-data-open:-rotate-180 group-data-[state=open]:-rotate-180 md:ml-1 md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              {!auth.isAuthenticated ? (
                <>
                  <div className="mb-2 flex items-center justify-between px-2 py-2">
                    <span className="text-sm font-medium text-muted-foreground">New customer?</span>
                    <Link to="/register" className="text-sm font-bold text-primary hover:underline">
                      Sign Up
                    </Link>
                  </div>
                  <DropdownMenuSeparator className="mb-2" />
                  <DropdownMenuItem asChild className="cursor-pointer font-medium">
                    <Link to="/login">
                      <LogInIcon className="mr-3 size-4 text-muted-foreground" />
                      <span>Sign In</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                </>
              ) : (
                <>
                  <div className="mb-2 flex flex-col px-2 py-2">
                    <span className="text-sm font-semibold">{auth.session?.user.displayName ?? "Customer"}</span>
                    <span className="text-xs text-muted-foreground">{auth.session?.user.email}</span>
                  </div>
                  <DropdownMenuSeparator className="mb-2" />
                </>
              )}

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={auth.isAuthenticated ? buildCustomerPortalPath('/profile') : '/login'}>
                  <UserCircle2Icon className="mr-3 size-4 text-muted-foreground" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={auth.isAuthenticated ? buildCustomerPortalPath('/orders') : "/login"}>
                  <PackageIcon className="mr-3 size-4 text-muted-foreground" />
                  <span>Orders</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/wishlist">
                  <HeartIcon
                    className={cn(
                      "mr-3 size-4",
                      wishlistHasItems ? "fill-current text-primary" : "text-muted-foreground",
                    )}
                    strokeWidth={1.9}
                  />
                  <span>Wishlist</span>
                  {wishlistCount > 0 ? <Badge className="ml-auto min-w-5 justify-center rounded-full px-1 text-[10px]">{wishlistCount}</Badge> : null}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/cart">
                  <ShoppingCartIcon
                    className={cn(
                      "mr-3 size-4",
                      cartHasItems ? "fill-current text-primary" : "text-muted-foreground",
                    )}
                    strokeWidth={1.9}
                  />
                  <span>Cart</span>
                  {cartItemsCount > 0 ? <Badge className="ml-auto min-w-5 justify-center rounded-full px-1 text-[10px]">{cartItemsCount}</Badge> : null}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/">
                  <GiftIcon className="mr-3 size-4 text-muted-foreground" />
                  <span>Rewards</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/contact">
                  <CreditCardIcon className="mr-3 size-4 text-muted-foreground" />
                  <span>Gift Cards</span>
                </Link>
              </DropdownMenuItem>

              {auth.isAuthenticated ? (
                <>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to={dashboardHref}>
                      <LayoutDashboardIcon className="mr-3 size-4 text-muted-foreground" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                    <LogOutIcon className="mr-3 size-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="group cursor-pointer rounded-full px-3 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground md:px-4">
                <span className="hidden text-sm font-medium md:inline-block">More</span>
                <ChevronDownIcon className="hidden size-4 transition-transform group-data-open:-rotate-180 group-data-[state=open]:-rotate-180 md:ml-1 md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-2">
              <div className="mb-2 px-2 py-2">
                <span className="text-sm font-semibold">Explore More Options</span>
              </div>
              <DropdownMenuSeparator className="mb-2" />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/contact">
                  <StoreIcon className="mr-3 size-4 text-muted-foreground" />
                  <span>Become a Seller</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={auth.isAuthenticated ? buildCustomerPortalPath('/notifications') : "/login"}>
                  <BellIcon className="mr-3 size-4 text-muted-foreground" />
                  <span>Notification Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={auth.isAuthenticated ? buildCustomerPortalPath('/support') : "/contact"}>
                  <HeadphonesIcon className="mr-3 size-4 text-muted-foreground" />
                  <span>24x7 Customer Care</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/services">
                  <TrendingUpIcon className="mr-3 size-4 text-muted-foreground" />
                  <span>Advertise</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/contact">
                  <HeadphonesIcon className="mr-3 size-4 text-muted-foreground" />
                  <span>Contact Team</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
