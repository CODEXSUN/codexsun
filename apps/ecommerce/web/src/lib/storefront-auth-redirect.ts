const storefrontPostAuthRedirectStorageKey =
  "codexsun.storefront.post-auth-redirect"

function canUseSessionStorage() {
  return typeof window !== "undefined"
}

function isSafeStorefrontPath(path: string | null | undefined) {
  return Boolean(path && path.startsWith("/"))
}

export function setStorefrontPostAuthRedirect(path: string) {
  if (!canUseSessionStorage() || !isSafeStorefrontPath(path)) {
    return
  }

  window.sessionStorage.setItem(storefrontPostAuthRedirectStorageKey, path)
}

export function consumeStorefrontPostAuthRedirect() {
  if (!canUseSessionStorage()) {
    return null
  }

  const value = window.sessionStorage.getItem(storefrontPostAuthRedirectStorageKey)
  window.sessionStorage.removeItem(storefrontPostAuthRedirectStorageKey)

  return isSafeStorefrontPath(value) ? value : null
}

export function clearStorefrontPostAuthRedirect() {
  if (!canUseSessionStorage()) {
    return
  }

  window.sessionStorage.removeItem(storefrontPostAuthRedirectStorageKey)
}
