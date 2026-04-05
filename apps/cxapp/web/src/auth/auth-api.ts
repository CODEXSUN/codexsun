import type {
  AuthAccountRecoveryRequestPayload,
  AuthAccountRecoveryRequestResponse,
  AuthAccountRecoveryRestorePayload,
  AuthAccountRecoveryRestoreResponse,
  AuthLoginPayload,
  AuthPasswordResetConfirmPayload,
  AuthPasswordResetConfirmResponse,
  AuthPasswordResetRequestPayload,
  AuthPasswordResetRequestResponse,
  AuthRegisterOtpRequestPayload,
  AuthRegisterOtpRequestResponse,
  AuthRegisterOtpVerifyPayload,
  AuthRegisterOtpVerifyResponse,
  AuthRegisterPayload,
  AuthTokenResponse,
  AuthUser,
} from "@cxapp/shared"

export class HttpError extends Error {
  readonly statusCode: number
  readonly context?: unknown

  constructor(
    message: string,
    statusCode: number,
    context?: unknown
  ) {
    super(message)
    this.name = "HttpError"
    this.statusCode = statusCode
    this.context = context
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: string; message?: string; context?: unknown }
    | null

  if (!response.ok) {
    const message =
      payload && typeof payload === "object"
        ? ("error" in payload && payload.error) ||
          ("message" in payload && payload.message) ||
          "Request failed."
        : "Request failed."
    const context =
      payload && typeof payload === "object" && "context" in payload
        ? payload.context
        : undefined
    throw new HttpError(String(message), response.status, context)
  }

  return payload as T
}

function createAuthorizationHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
  }
}

export function login(payload: AuthLoginPayload) {
  return request<AuthTokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function requestRegisterOtp(payload: AuthRegisterOtpRequestPayload) {
  return request<AuthRegisterOtpRequestResponse>("/api/v1/auth/register/request-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function verifyRegisterOtp(payload: AuthRegisterOtpVerifyPayload) {
  return request<AuthRegisterOtpVerifyResponse>("/api/v1/auth/register/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function register(payload: AuthRegisterPayload) {
  return request<AuthTokenResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function requestPasswordResetOtp(payload: AuthPasswordResetRequestPayload) {
  return request<AuthPasswordResetRequestResponse>(
    "/api/v1/auth/password-reset/request-otp",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export function confirmPasswordReset(payload: AuthPasswordResetConfirmPayload) {
  return request<AuthPasswordResetConfirmResponse>("/api/v1/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function requestAccountRecoveryOtp(
  payload: AuthAccountRecoveryRequestPayload
) {
  return request<AuthAccountRecoveryRequestResponse>(
    "/api/v1/auth/account-recovery/request-otp",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export function restoreAccount(payload: AuthAccountRecoveryRestorePayload) {
  return request<AuthAccountRecoveryRestoreResponse>(
    "/api/v1/auth/account-recovery/restore",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export function getCurrentUser(token: string) {
  return request<AuthUser>("/api/v1/auth/me", {
    headers: createAuthorizationHeaders(token),
  })
}

export function logout(token: string) {
  return request<{ revoked: true }>("/api/v1/auth/logout", {
    method: "POST",
    headers: createAuthorizationHeaders(token),
  })
}
