import type { AuthUser } from "@cxapp/shared"

export type StoredAuthSession = {
  accessToken: string
  expiresAt: string
  sessionId: string
  user: AuthUser
}

const authSessionStorageKey = "codexsun.auth.session"

export function readStoredAuthSession() {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.localStorage.getItem(authSessionStorageKey)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as StoredAuthSession
  } catch {
    window.localStorage.removeItem(authSessionStorageKey)
    return null
  }
}

export function persistStoredAuthSession(session: StoredAuthSession) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(authSessionStorageKey, JSON.stringify(session))
}

export function clearStoredAuthSession() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(authSessionStorageKey)
}

export function getStoredAccessToken() {
  return readStoredAuthSession()?.accessToken ?? null
}
