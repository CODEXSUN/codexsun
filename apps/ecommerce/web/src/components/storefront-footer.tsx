import { Link } from "react-router-dom"

import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"

import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontFooter() {
  const { brand } = useRuntimeBrand()

  return (
    <footer className="border-t border-border/70 bg-[#17120e] text-stone-200">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div className="space-y-4">
          <p className="font-heading text-2xl font-semibold tracking-tight">
            {brand?.brandName ?? "Codexsun Store"}
          </p>
          <p className="max-w-xl text-sm leading-6 text-stone-300/85">
            Shared core catalog, standalone ecommerce flows, and a customer portal built as its own app boundary.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
              Shop
            </p>
            <div className="grid gap-1 text-sm">
              <Link to={storefrontPaths.catalog()} className="transition hover:text-white">
                Catalog
              </Link>
              <Link to={storefrontPaths.cart()} className="transition hover:text-white">
                Cart
              </Link>
              <Link to={storefrontPaths.checkout()} className="transition hover:text-white">
                Checkout
              </Link>
              <Link to={storefrontPaths.trackOrder()} className="transition hover:text-white">
                Track Order
              </Link>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
              Account
            </p>
            <div className="grid gap-1 text-sm">
              <Link to={storefrontPaths.accountLogin()} className="transition hover:text-white">
                Sign In
              </Link>
              <Link to={storefrontPaths.accountRegister()} className="transition hover:text-white">
                Create Account
              </Link>
              <Link to={storefrontPaths.account()} className="transition hover:text-white">
                Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
