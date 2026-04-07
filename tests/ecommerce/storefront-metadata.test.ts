import assert from "node:assert/strict"
import test from "node:test"

import {
  formatStorefrontDocumentTitle,
  resolveStorefrontRouteMetadata,
} from "../../apps/ecommerce/web/src/lib/storefront-metadata.ts"

test("storefront route metadata resolves public and shop-prefixed routes", () => {
  assert.deepEqual(resolveStorefrontRouteMetadata("/"), {
    title: "Tirupur Direct Storefront",
    description:
      "Browse the Tirupur Direct storefront with curated product stories, category discovery, and direct checkout.",
    robots: "index,follow",
    openGraphImagePath: "/logo.svg",
  })

  assert.deepEqual(resolveStorefrontRouteMetadata("/shop/catalog"), {
    title: "Catalog",
    description:
      "Search the live storefront catalog by category, department, brand, and merchandising filters.",
    robots: "index,follow",
    openGraphImagePath: "/logo.svg",
  })

  assert.deepEqual(resolveStorefrontRouteMetadata("/products/premium-knit-polo"), {
    title: "Product details",
    description:
      "Review product details, specifications, pricing, availability, and purchase actions for the selected storefront item.",
    robots: "index,follow",
    openGraphImagePath: "/logo.svg",
  })

  assert.deepEqual(resolveStorefrontRouteMetadata("/shop/terms"), {
    title: "Terms and conditions",
    description:
      "Read the storefront terms covering orders, pricing, payments, fulfilment, and acceptable use.",
    robots: "index,follow",
    openGraphImagePath: "/logo.svg",
  })

  assert.deepEqual(resolveStorefrontRouteMetadata("/customer/orders/order-1"), {
    title: "Customer account",
    description:
      "Manage your storefront profile, orders, wishlist, checkout details, and support history.",
    robots: "noindex,nofollow",
    openGraphImagePath: "/logo.svg",
  })

  assert.equal(resolveStorefrontRouteMetadata("/dashboard/settings"), null)
})

test("storefront route metadata formats document titles with brand suffix", () => {
  assert.equal(
    formatStorefrontDocumentTitle(
      { title: "Catalog", description: "Catalog page" },
      "Tirupur Direct"
    ),
    "Catalog | Tirupur Direct"
  )
})
