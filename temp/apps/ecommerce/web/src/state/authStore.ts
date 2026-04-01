import { useSyncExternalStore } from "react"
import type { AuthClaims, AuthRole, AuthState, AuthUser, LoginRequest, RegisterRequest, TokenResponse } from "@/types/auth"
import { resetWishlistStore, useWishlistStore } from "@/state/wishlistStore"

const ACCESS_TOKEN_KEY = "cxstore.auth.accessToken"
const REFRESH_TOKEN_KEY = "cxstore.auth.refreshToken"
const EXPIRES_AT_KEY = "cxstore.auth.expiresAt"
const USER_KEY = "cxstore.auth.user"

const listeners = new Set<() => void>()

let refreshPromise: Promise<boolean> | null = null
let initializePromise: Promise<void> | null = null

let state: AuthState = {
  accessToken: readStorage(ACCESS_TOKEN_KEY),
  refreshToken: readStorage(REFRESH_TOKEN_KEY),
  expiresAt: readStorage(EXPIRES_AT_KEY),
  user: readUserStorage(),
  claims: decodeClaims(readStorage(ACCESS_TOKEN_KEY)),
  isAuthenticated: Boolean(readStorage(ACCESS_TOKEN_KEY) && readStorage(REFRESH_TOKEN_KEY)),
  isInitializing: true,
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(key)
}

function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") {
    return
  }

  if (value === null) {
    window.localStorage.removeItem(key)
    return
  }

  window.localStorage.setItem(key, value)
}

function readUserStorage(): AuthUser | null {
  const raw = readStorage(USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    writeStorage(USER_KEY, null)
    return null
  }
}

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function setState(nextState: AuthState) {
  state = nextState
  emitChange()
}

function decodeClaims(accessToken: string | null): AuthClaims | null {
  if (!accessToken || typeof window === "undefined") {
    return null
  }

  try {
    const [, payload] = accessToken.split(".")
    if (!payload) {
      return null
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=")
    const decoded = JSON.parse(window.atob(padded)) as Record<string, string | string[] | undefined>
    const permissions = decoded.Permissions

    return {
      userId: typeof decoded.UserId === "string" ? decoded.UserId : typeof decoded.sub === "string" ? decoded.sub : null,
      username: typeof decoded.Username === "string" ? decoded.Username : typeof decoded.unique_name === "string" ? decoded.unique_name : null,
      role: typeof decoded.Role === "string" ? decoded.Role : typeof decoded.role === "string" ? decoded.role : null,
      permissions: Array.isArray(permissions)
        ? permissions.filter((permission): permission is string => typeof permission === "string")
        : typeof permissions === "string"
          ? [permissions]
          : [],
    }
  } catch {
    return null
  }
}

function persistSession(tokens: Pick<TokenResponse, "accessToken" | "refreshToken" | "expiresAt">, user: AuthUser | null) {
  writeStorage(ACCESS_TOKEN_KEY, tokens.accessToken)
  writeStorage(REFRESH_TOKEN_KEY, tokens.refreshToken)
  writeStorage(EXPIRES_AT_KEY, tokens.expiresAt)
  writeStorage(USER_KEY, user ? JSON.stringify(user) : null)

  setState({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    user,
    claims: decodeClaims(tokens.accessToken),
    isAuthenticated: true,
    isInitializing: false,
  })
}

async function hydrateAuthenticatedSession(tokens: Pick<TokenResponse, "accessToken" | "refreshToken" | "expiresAt">) {
  const authApi = await import("@/api/authApi")

  // Store the access token first so the follow-up /auth/me request carries Authorization.
  persistSession(tokens, null)
  const user = await authApi.getCurrentUser()
  updateStoredUser(user)
  const cartStore = await import("@/state/cartStore")
  await cartStore.useCartStore.getState().hydrateCart()
  await useWishlistStore.getState().hydrateWishlist()
}

export function updateStoredUser(user: AuthUser | null) {
  writeStorage(USER_KEY, user ? JSON.stringify(user) : null)
  setState({
    ...state,
    user,
    isAuthenticated: Boolean(state.accessToken && state.refreshToken && user),
    isInitializing: false,
  })
  resetWishlistStore()
}

export function clearAuthState() {
  writeStorage(ACCESS_TOKEN_KEY, null)
  writeStorage(REFRESH_TOKEN_KEY, null)
  writeStorage(EXPIRES_AT_KEY, null)
  writeStorage(USER_KEY, null)

  setState({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    user: null,
    claims: null,
    isAuthenticated: false,
    isInitializing: false,
  })
}

export function getAccessToken() {
  return state.accessToken
}

export function getRefreshToken() {
  return state.refreshToken
}

export async function initializeAuth() {
  if (initializePromise) {
    return initializePromise
  }

  initializePromise = (async () => {
    if (!state.refreshToken) {
      clearAuthState()
      return
    }

    setState({ ...state, isInitializing: true })
    const refreshed = await refreshSession()
    if (!refreshed) {
      clearAuthState()
      return
    }

    setState({ ...state, isInitializing: false })
  })()

  try {
    await initializePromise
  } finally {
    initializePromise = null
  }
}

export async function login(credentials: LoginRequest) {
  const authApi = await import("@/api/authApi")
  const tokens = await authApi.login(credentials)
  await hydrateAuthenticatedSession(tokens)
}

export async function register(account: RegisterRequest) {
  const authApi = await import("@/api/authApi")
  const tokens = await authApi.register(account)
  await hydrateAuthenticatedSession(tokens)
}

export async function refreshSession() {
  if (refreshPromise) {
    return refreshPromise
  }

  const currentRefreshToken = state.refreshToken
  if (!currentRefreshToken) {
    clearAuthState()
    return false
  }

  refreshPromise = (async () => {
    try {
      const authApi = await import("@/api/authApi")
      const tokens = await authApi.refreshToken({ refreshToken: currentRefreshToken })
      persistSession(tokens, state.user)
      const user = await authApi.getCurrentUser()
      updateStoredUser(user)
      const cartStore = await import("@/state/cartStore")
      await cartStore.useCartStore.getState().hydrateCart()
      await useWishlistStore.getState().hydrateWishlist()
      return true
    } catch {
      clearAuthState()
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function logout() {
  const currentRefreshToken = state.refreshToken

  try {
    if (currentRefreshToken) {
      const authApi = await import("@/api/authApi")
      await authApi.logout({ refreshToken: currentRefreshToken })
    }
  } finally {
    clearAuthState()
  }
}

export function isRoleAllowed(allowedRoles?: AuthRole[]) {
  if (!allowedRoles?.length) {
    return true
  }

  const activeRole = state.user?.role ?? state.claims?.role
  return activeRole !== null && activeRole !== undefined && allowedRoles.includes(activeRole)
}

export function useAuth() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
    () => state,
  )
}
