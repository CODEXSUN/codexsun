import type { ReactNode } from "react"

import { StorefrontCartProvider } from "@ecommerce/web/src/cart/storefront-cart"
import { StorefrontRouteMetadata } from "@ecommerce/web/src/components/storefront-route-metadata"

export function ShopRuntimeShell({ children }: { children: ReactNode }) {
  return (
    <StorefrontCartProvider>
      <StorefrontRouteMetadata />
      {children}
    </StorefrontCartProvider>
  )
}
