export const storefrontFrontendTargetValues = ["site", "shop", "app"] as const

export type StorefrontFrontendTarget =
  (typeof storefrontFrontendTargetValues)[number]

function normalizeStorefrontFrontendTarget(
  value: string | undefined
): StorefrontFrontendTarget {
  if (value === "site" || value === "shop" || value === "app") {
    return value
  }

  return "site"
}

export const storefrontFrontendTarget = normalizeStorefrontFrontendTarget(
  import.meta.env.VITE_FRONTEND_TARGET
)

export const storefrontRootPath =
  storefrontFrontendTarget === "shop" ? "/" : "/shop"

function withStorefrontRoot(segment = "") {
  if (storefrontRootPath === "/") {
    if (!segment) {
      return "/"
    }

    return segment.startsWith("/") ? segment : `/${segment}`
  }

  if (!segment) {
    return storefrontRootPath
  }

  return `${storefrontRootPath}${segment.startsWith("/") ? segment : `/${segment}`}`
}

export const storefrontPaths = {
  home: () => withStorefrontRoot(),
  catalog: () => withStorefrontRoot("/catalog"),
  product: (slug: string) =>
    withStorefrontRoot(`/products/${encodeURIComponent(slug)}`),
  cart: () => withStorefrontRoot("/cart"),
  checkout: () => withStorefrontRoot("/checkout"),
  trackOrder: (params?: { orderNumber?: string; email?: string }) => {
    const path = withStorefrontRoot("/track-order")

    if (!params?.orderNumber && !params?.email) {
      return path
    }

    const searchParams = new URLSearchParams()

    if (params.orderNumber) {
      searchParams.set("orderNumber", params.orderNumber)
    }

    if (params.email) {
      searchParams.set("email", params.email)
    }

    const search = searchParams.toString()

    return search ? `${path}?${search}` : path
  },
  accountLogin: (_next?: string | null) => "/login",
  accountRegister: () => withStorefrontRoot("/customer/register"),
  account: () => withStorefrontRoot("/customer"),
  accountSection: (
    section: "overview" | "profile" | "wishlist" | "cart" | "orders" | "support" | "coupons" | "gift-cards" | "rewards"
  ) => withStorefrontRoot(`/customer/${encodeURIComponent(section)}`),
  accountOrder: (orderId: string) =>
    withStorefrontRoot(`/customer/orders/${encodeURIComponent(orderId)}`),
}

export function normalizeStorefrontHref(
  href: string | null | undefined
): string | null | undefined {
  if (!href || !href.startsWith("/shop")) {
    return href
  }

  if (storefrontRootPath === "/") {
    const normalized = href.replace(/^\/shop(?=\/|$)/, "")
    return normalized.length > 0 ? normalized : "/"
  }

  return href
}
