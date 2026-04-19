export type StorefrontRouteMetadata = {
  title: string | null
  description: string
  robots: "index,follow" | "noindex,nofollow"
  openGraphImagePath: string
}

const storefrontMetadataEntries: Array<{
  pattern: RegExp
  metadata: StorefrontRouteMetadata
}> = [
  {
    pattern: /^\/$/,
    metadata: {
      title: null,
      description:
        "Browse the Tirupur Direct storefront with curated product stories, category discovery, and direct checkout.",
      robots: "index,follow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/catalog$/,
    metadata: {
      title: "Catalog",
      description:
        "Search the live storefront catalog by category, department, brand, and merchandising filters.",
      robots: "index,follow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/products\/[^/]+$/,
    metadata: {
      title: "Product details",
      description:
        "Review product details, specifications, pricing, and purchase actions for the selected storefront item.",
      robots: "index,follow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/cart$/,
    metadata: {
      title: "Cart",
      description:
        "Review selected storefront items, shipping totals, and proceed to secure checkout.",
      robots: "noindex,nofollow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/checkout$/,
    metadata: {
      title: "Checkout",
      description:
        "Complete delivery, pickup, and payment details to place your storefront order.",
      robots: "noindex,nofollow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/track-order$/,
    metadata: {
      title: "Track order",
      description:
        "Track storefront fulfilment and dispatch progress with your order number and email address.",
      robots: "noindex,nofollow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/shipping$/,
    metadata: {
      title: "Shipping policy",
      description:
        "Review storefront shipping, dispatch, delivery timelines, and charge information before ordering.",
      robots: "index,follow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/returns$/,
    metadata: {
      title: "Returns and exchanges",
      description:
        "Understand storefront return eligibility, exchange handling, and refund rules.",
      robots: "index,follow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/privacy$/,
    metadata: {
      title: "Privacy policy",
      description:
        "Learn how storefront customer, order, and support data is collected, used, and retained.",
      robots: "index,follow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/terms$/,
    metadata: {
      title: "Terms and conditions",
      description:
        "Read the storefront terms covering orders, pricing, payments, fulfilment, and acceptable use.",
      robots: "index,follow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/contact$/,
    metadata: {
      title: "Contact support",
      description:
        "Reach the storefront support team for order help, pickup clarification, and business enquiries.",
      robots: "index,follow",
      openGraphImagePath: "/logo.svg",
    },
  },
  {
    pattern: /^\/customer(?:\/.*)?$/,
    metadata: {
      title: "Customer account",
      description:
        "Manage your storefront profile, orders, wishlist, checkout details, and support history.",
      robots: "noindex,nofollow",
      openGraphImagePath: "/logo.svg",
    },
  },
]

function normalizeStorefrontPathname(pathname: string) {
  if (!pathname.startsWith("/shop")) {
    return pathname
  }

  const normalized = pathname.replace(/^\/shop(?=\/|$)/, "")
  return normalized.length > 0 ? normalized : "/"
}

export function resolveStorefrontRouteMetadata(
  pathname: string
): StorefrontRouteMetadata | null {
  const normalizedPathname = normalizeStorefrontPathname(pathname)

  for (const entry of storefrontMetadataEntries) {
    if (entry.pattern.test(normalizedPathname)) {
      return entry.metadata
    }
  }

  return null
}

export function formatStorefrontDocumentTitle(
  metadata: StorefrontRouteMetadata,
  brandName = "Codexsun"
) {
  const routeTitle = metadata.title?.trim()

  if (!routeTitle) {
    return brandName
  }

  return `${metadata.title} | ${brandName}`
}
