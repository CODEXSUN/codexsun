import { createContext, useContext } from "react"

import type {
  AuthAccountRecoveryRequestPayload,
  AuthAccountRecoveryRestorePayload,
  AuthLoginPayload,
  AuthPasswordLinkCompletePayload,
  AuthPasswordResetRequestPayload,
  AuthRegisterOtpRequestPayload,
  AuthRegisterOtpVerifyPayload,
  AuthUser,
  AuthTokenResponse,
} from "@cxapp/shared"

import type * as authApi from "./auth-api"
import type { StoredAuthSession } from "./session-storage"

export type AuthContextValue = {
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
  requestPasswordResetLink: (
    payload: AuthPasswordResetRequestPayload
  ) => ReturnType<typeof authApi.requestPasswordResetLink>
  completePasswordLink: (
    payload: AuthPasswordLinkCompletePayload
  ) => ReturnType<typeof authApi.completePasswordLink>
  requestAccountRecoveryOtp: (
    payload: AuthAccountRecoveryRequestPayload
  ) => ReturnType<typeof authApi.requestAccountRecoveryOtp>
  restoreAccount: (
    payload: AuthAccountRecoveryRestorePayload
  ) => ReturnType<typeof authApi.restoreAccount>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.")
  }

  return context
}
