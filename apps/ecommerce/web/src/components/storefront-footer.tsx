import { Link } from "react-router-dom"

import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"

import { useStorefrontShellData } from "../hooks/use-storefront-shell-data"
import { normalizeStorefrontHref } from "../lib/storefront-routes"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontFooter() {
  const { brand } = useRuntimeBrand()
  const { data } = useStorefrontShellData()
  const settings = data?.settings
  const showSupport = Boolean(settings?.visibility.support)
  const footerGroups = settings?.footer.groups ?? []

  return (
    <footer className="border-t border-[#2d211b] bg-[#17120e] text-stone-200">
      <div
        className={`mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 lg:px-8 ${
          footerGroups.length > 0 ? "lg:grid-cols-[1.1fr_0.9fr]" : ""
        }`}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="font-heading text-2xl font-semibold tracking-tight text-white">
              {brand?.brandName ?? "Codexsun Store"}
            </p>
            <p className="max-w-xl text-sm leading-7 text-stone-300/85">
              {settings?.footer.description ??
                "Shared core catalog, standalone ecommerce flows, and a customer portal built as its own app boundary."}
            </p>
          </div>
          <div className={`grid gap-3 ${showSupport ? "sm:grid-cols-2" : ""}`}>
            {showSupport ? (
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Support</p>
                <p className="mt-3 text-sm text-stone-100">
                  {settings?.supportEmail ?? "storefront@codexsun.local"}
                </p>
                <p className="mt-1 text-sm text-stone-300">
                  {settings?.supportPhone ?? "+91 90000 12345"}
                </p>
              </div>
            ) : null}
            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Customer portal</p>
              <div className="mt-3 grid gap-1 text-sm">
                <Link to={storefrontPaths.account()} className="transition hover:text-white">
                  Profile
                </Link>
                <Link to={storefrontPaths.accountRegister()} className="transition hover:text-white">
                  Register
                </Link>
                <Link to={storefrontPaths.trackOrder()} className="transition hover:text-white">
                  Track order
                </Link>
              </div>
            </div>
          </div>
        </div>
        {footerGroups.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2">
            {footerGroups.map((group) => (
              <div key={group.id} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                  {group.title}
                </p>
                <div className="grid gap-2 text-sm">
                  {group.links.map((item) => (
                    <Link
                      key={`${group.id}:${item.href}:${item.label}`}
                      to={normalizeStorefrontHref(item.href) ?? item.href}
                      className="transition hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  )
}
