export type StorefrontSeoTarget = "site" | "shop" | "app"

export const storefrontLegalPageIds = [
  "shipping",
  "returns",
  "privacy",
  "terms",
  "contact",
] as const

export function normalizeStorefrontCanonicalPath(
  pathname: string,
  target: StorefrontSeoTarget
) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`

  if (target === "shop") {
    const withoutAlias = normalizedPath.replace(/^\/shop(?=\/|$)/, "")
    return withoutAlias.length > 0 ? withoutAlias : "/"
  }

  if (normalizedPath === "/") {
    return "/shop"
  }

  return normalizedPath.startsWith("/shop") ? normalizedPath : `/shop${normalizedPath}`
}

export function buildStorefrontAbsoluteUrl(
  origin: string,
  pathname: string,
  target: StorefrontSeoTarget
) {
  const normalizedOrigin = origin.replace(/\/+$/, "")
  const canonicalPath = normalizeStorefrontCanonicalPath(pathname, target)

  return `${normalizedOrigin}${canonicalPath}`
}
