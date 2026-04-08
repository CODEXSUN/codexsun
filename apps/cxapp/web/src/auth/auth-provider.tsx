import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { AuthTokenResponse } from "@cxapp/shared"

import * as authApi from "./auth-api"
import { AuthContext, type AuthContextValue } from "./auth-context"
import {
  clearCachedAppSessionState,
  persistCachedAppSessionState,
} from "./app-session-cache"
import {
  clearStoredAuthSession,
  persistStoredAuthSession,
  readStoredAuthSession,
  type StoredAuthSession,
} from "./session-storage"
import { useAppSessionStore } from "../state/app-session-store"

function toStoredSession(response: AuthTokenResponse): StoredAuthSession {
  return {
    accessToken: response.accessToken,
    expiresAt: response.expiresAt,
    sessionId: response.sessionId,
    user: response.user,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSessionState = useAppSessionStore((state) => state.setSessionState)
  const [session, setSession] = useState<StoredAuthSession | null>(() =>
    readStoredAuthSession()
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const stored = readStoredAuthSession()

      if (!stored) {
        clearCachedAppSessionState()
        if (!cancelled) {
          setSession(null)
          setIsLoading(false)
        }
        return
      }

      try {
        const user = await authApi.getCurrentUser(stored.accessToken)
        const nextSession = {
          ...stored,
          user,
        }
        persistStoredAuthSession(nextSession)
        persistCachedAppSessionState(nextSession.user)

        if (!cancelled) {
          setSession(nextSession)
          setIsLoading(false)
        }
      } catch {
        clearStoredAuthSession()
        clearCachedAppSessionState()

        if (!cancelled) {
          setSession(null)
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSessionState({
      user: session?.user ?? null,
      isLoading,
    })
  }, [isLoading, session, setSessionState])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: Boolean(session?.accessToken),
      session,
      user: session?.user ?? null,
      login: async (payload) => {
        const response = await authApi.login(payload)
        const nextSession = toStoredSession(response)
        persistStoredAuthSession(nextSession)
        persistCachedAppSessionState(nextSession.user)
        setSession(nextSession)
        return response
      },
      logout: async () => {
        if (session?.accessToken) {
          try {
            await authApi.logout(session.accessToken)
          } catch {
            // Ignore logout failures and clear the local session regardless.
          }
        }

        clearStoredAuthSession()
        clearCachedAppSessionState()
        setSession(null)
      },
      requestRegisterOtp: authApi.requestRegisterOtp,
      verifyRegisterOtp: authApi.verifyRegisterOtp,
      requestPasswordResetLink: authApi.requestPasswordResetLink,
      completePasswordLink: authApi.completePasswordLink,
      requestAccountRecoveryOtp: authApi.requestAccountRecoveryOtp,
      restoreAccount: authApi.restoreAccount,
    }),
    [isLoading, session]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
