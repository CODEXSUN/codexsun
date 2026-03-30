import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type {
  AuthAccountRecoveryRequestPayload,
  AuthAccountRecoveryRestorePayload,
  AuthLoginPayload,
  AuthPasswordResetConfirmPayload,
  AuthPasswordResetRequestPayload,
  AuthRegisterOtpRequestPayload,
  AuthRegisterOtpVerifyPayload,
  AuthRegisterPayload,
  AuthTokenResponse,
  AuthUser,
} from "@core/shared"

import * as authApi from "./auth-api"
import {
  clearStoredAuthSession,
  persistStoredAuthSession,
  readStoredAuthSession,
  type StoredAuthSession,
} from "./session-storage"

type AuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  session: StoredAuthSession | null
  user: AuthUser | null
  login: (payload: AuthLoginPayload) => Promise<AuthTokenResponse>
  logout: () => Promise<void>
  requestRegisterOtp: (
    payload: AuthRegisterOtpRequestPayload
  ) => ReturnType<typeof authApi.requestRegisterOtp>
  verifyRegisterOtp: (
    payload: AuthRegisterOtpVerifyPayload
  ) => ReturnType<typeof authApi.verifyRegisterOtp>
  register: (payload: AuthRegisterPayload) => Promise<AuthTokenResponse>
  requestPasswordResetOtp: (
    payload: AuthPasswordResetRequestPayload
  ) => ReturnType<typeof authApi.requestPasswordResetOtp>
  confirmPasswordReset: (
    payload: AuthPasswordResetConfirmPayload
  ) => ReturnType<typeof authApi.confirmPasswordReset>
  requestAccountRecoveryOtp: (
    payload: AuthAccountRecoveryRequestPayload
  ) => ReturnType<typeof authApi.requestAccountRecoveryOtp>
  restoreAccount: (
    payload: AuthAccountRecoveryRestorePayload
  ) => ReturnType<typeof authApi.restoreAccount>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toStoredSession(response: AuthTokenResponse): StoredAuthSession {
  return {
    accessToken: response.accessToken,
    expiresAt: response.expiresAt,
    sessionId: response.sessionId,
    user: response.user,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredAuthSession | null>(() =>
    readStoredAuthSession()
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const stored = readStoredAuthSession()

      if (!stored) {
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

        if (!cancelled) {
          setSession(nextSession)
          setIsLoading(false)
        }
      } catch {
        clearStoredAuthSession()

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
        setSession(null)
      },
      requestRegisterOtp: authApi.requestRegisterOtp,
      verifyRegisterOtp: authApi.verifyRegisterOtp,
      register: async (payload) => {
        const response = await authApi.register(payload)
        const nextSession = toStoredSession(response)
        persistStoredAuthSession(nextSession)
        setSession(nextSession)
        return response
      },
      requestPasswordResetOtp: authApi.requestPasswordResetOtp,
      confirmPasswordReset: authApi.confirmPasswordReset,
      requestAccountRecoveryOtp: authApi.requestAccountRecoveryOtp,
      restoreAccount: authApi.restoreAccount,
    }),
    [isLoading, session]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.")
  }

  return context
}
