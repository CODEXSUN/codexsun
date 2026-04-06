const storefrontWishlistStorageKey = "codexsun-storefront-wishlist"
const listeners = new Set<() => void>()
const emptyWishlistProductIds: string[] = []
let cachedWishlistRawValue: string | null | undefined
let cachedWishlistProductIds = emptyWishlistProductIds

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

function setCachedWishlistProductIds(rawValue: string | null, productIds: string[]) {
  cachedWishlistRawValue = rawValue
  cachedWishlistProductIds =
    productIds.length > 0 ? normalizeWishlistProductIds(productIds) : emptyWishlistProductIds

  return cachedWishlistProductIds
}

export function readStorefrontWishlistProductIds() {
  if (typeof window === "undefined") {
    return emptyWishlistProductIds
  }

  try {
    const rawValue = window.localStorage.getItem(storefrontWishlistStorageKey)

    if (rawValue === cachedWishlistRawValue) {
      return cachedWishlistProductIds
    }

    if (!rawValue) {
      return setCachedWishlistProductIds(null, emptyWishlistProductIds)
    }

    const parsed = JSON.parse(rawValue) as unknown

    return Array.isArray(parsed)
      ? setCachedWishlistProductIds(
          rawValue,
          parsed.filter((item): item is string => typeof item === "string")
        )
      : setCachedWishlistProductIds(rawValue, emptyWishlistProductIds)
  } catch {
    window.localStorage.removeItem(storefrontWishlistStorageKey)
    return setCachedWishlistProductIds(null, emptyWishlistProductIds)
  }
}

export function writeStorefrontWishlistProductIds(productIds: string[]) {
  if (typeof window === "undefined") {
    return
  }

  const normalized = normalizeWishlistProductIds(productIds)

  if (normalized.length === 0) {
    window.localStorage.removeItem(storefrontWishlistStorageKey)
    setCachedWishlistProductIds(null, emptyWishlistProductIds)
    emitStorefrontWishlistChange()
    return
  }

  const rawValue = JSON.stringify(normalized)

  window.localStorage.setItem(storefrontWishlistStorageKey, rawValue)
  setCachedWishlistProductIds(rawValue, normalized)
  emitStorefrontWishlistChange()
}

export function clearStorefrontWishlistProductIds() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(storefrontWishlistStorageKey)
  setCachedWishlistProductIds(null, emptyWishlistProductIds)
  emitStorefrontWishlistChange()
}

export function toggleStorefrontWishlistProductId(productId: string) {
  const normalizedProductId = productId.trim()
  const currentProductIds = readStorefrontWishlistProductIds()

  if (normalizedProductId.length === 0) {
    return currentProductIds
  }

  const nextProductIds = currentProductIds.includes(normalizedProductId)
    ? currentProductIds.filter((item) => item !== normalizedProductId)
    : [normalizedProductId, ...currentProductIds]

  writeStorefrontWishlistProductIds(nextProductIds)
  return nextProductIds
}

export function subscribeStorefrontWishlist(listener: () => void) {
  listeners.add(listener)

  if (typeof window !== "undefined" && listeners.size === 1) {
    window.addEventListener("storage", handleStorefrontWishlistStorage)
  }

  return () => {
    listeners.delete(listener)

    if (typeof window !== "undefined" && listeners.size === 0) {
      window.removeEventListener("storage", handleStorefrontWishlistStorage)
    }
  }
}

function handleStorefrontWishlistStorage(event: StorageEvent) {
  if (event.key !== storefrontWishlistStorageKey) {
    return
  }

  cachedWishlistRawValue = undefined
  readStorefrontWishlistProductIds()
  emitStorefrontWishlistChange()
}
