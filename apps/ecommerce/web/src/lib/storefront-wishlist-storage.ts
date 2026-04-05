const storefrontWishlistStorageKey = "codexsun-storefront-wishlist"
const listeners = new Set<() => void>()

function normalizeWishlistProductIds(productIds: string[]) {
  return Array.from(
    new Set(
      productIds
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  )
}

function emitStorefrontWishlistChange() {
  listeners.forEach((listener) => {
    listener()
  })
}

export function readStorefrontWishlistProductIds() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(storefrontWishlistStorageKey)

    if (!rawValue) {
      return []
    }

    const parsed = JSON.parse(rawValue) as unknown

    return Array.isArray(parsed)
      ? normalizeWishlistProductIds(
          parsed.filter((item): item is string => typeof item === "string")
        )
      : []
  } catch {
    window.localStorage.removeItem(storefrontWishlistStorageKey)
    return []
  }
}

export function writeStorefrontWishlistProductIds(productIds: string[]) {
  if (typeof window === "undefined") {
    return
  }

  const normalized = normalizeWishlistProductIds(productIds)

  if (normalized.length === 0) {
    window.localStorage.removeItem(storefrontWishlistStorageKey)
    emitStorefrontWishlistChange()
    return
  }

  window.localStorage.setItem(storefrontWishlistStorageKey, JSON.stringify(normalized))
  emitStorefrontWishlistChange()
}

export function clearStorefrontWishlistProductIds() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(storefrontWishlistStorageKey)
  emitStorefrontWishlistChange()
}

export function toggleStorefrontWishlistProductId(productId: string) {
  const normalizedProductId = productId.trim()

  if (normalizedProductId.length === 0) {
    return readStorefrontWishlistProductIds()
  }

  const nextProductIds = readStorefrontWishlistProductIds().includes(normalizedProductId)
    ? readStorefrontWishlistProductIds().filter((item) => item !== normalizedProductId)
    : [normalizedProductId, ...readStorefrontWishlistProductIds()]

  writeStorefrontWishlistProductIds(nextProductIds)
  return nextProductIds
}

export function subscribeStorefrontWishlist(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
