import { UserRound } from "lucide-react"
import { Link, NavLink } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { useAuth } from "@cxapp/web/src/auth/auth-context"
import {
  isCustomerSurfaceUser,
  resolveAuthenticatedHomePath,
} from "@cxapp/web/src/auth/auth-surface"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { storefrontPaths } from "../lib/storefront-routes"

import { StorefrontCartSheet } from "./storefront-cart-sheet"

const navItems = [
  { href: storefrontPaths.home(), label: "Home" },
  { href: storefrontPaths.catalog(), label: "Catalog" },
  { href: storefrontPaths.cart(), label: "Cart" },
  { href: storefrontPaths.trackOrder(), label: "Track Order" },
]

export function StorefrontHeader() {
  const { brand } = useRuntimeBrand()
  const customerAuth = useStorefrontCustomerAuth()
  const auth = useAuth()
  const authenticatedHomePath = resolveAuthenticatedHomePath(auth.user)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link to={storefrontPaths.home()} className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#2d211b_0%,#76563b_100%)] text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-sm">
              CS
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-semibold tracking-tight">
                {brand?.brandName ?? "Codexsun Store"}
              </p>
              <p className="truncate text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Ecommerce
              </p>
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `text-sm transition ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <StorefrontCartSheet />
          {auth.isAuthenticated ? (
            <Button asChild className="rounded-full">
              <Link
                to={
                  isCustomerSurfaceUser(auth.user)
                    ? storefrontPaths.account()
                    : authenticatedHomePath
                }
                className="gap-2"
              >
                <UserRound className="size-4" />
                {customerAuth.isAuthenticated ? "Account" : "Workspace"}
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full">
              <Link to={storefrontPaths.accountLogin()}>Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
