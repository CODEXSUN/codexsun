import { createContext, useContext } from "react"

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

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.")
  }

  return context
}
