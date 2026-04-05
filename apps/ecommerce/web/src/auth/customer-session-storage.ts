import type { CustomerProfile } from "@ecommerce/shared"

export type StoredCustomerSession = {
  sessionId: string
  accessToken: string
  customer: CustomerProfile
}

const storefrontSessionStorageKey = "codexsun.storefront.customer-session"

export function getStoredCustomerSession() {
  if (typeof window === "undefined") {
    return null
  }

  const rawValue = window.localStorage.getItem(storefrontSessionStorageKey)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as StoredCustomerSession
  } catch {
    window.localStorage.removeItem(storefrontSessionStorageKey)
    return null
  }
}

export function persistStoredCustomerSession(session: StoredCustomerSession) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(storefrontSessionStorageKey, JSON.stringify(session))
}

export function clearStoredCustomerSession() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(storefrontSessionStorageKey)
}
