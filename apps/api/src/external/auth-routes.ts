import { createAuthService } from "../../../cxapp/src/services/service-factory.js"
import { defineExternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { getRequestMeta, readBearerToken } from "../shared/request.js"

export function createAuthExternalRoutes(): HttpRouteDefinition[] {
  return [
    defineExternalRoute("/auth/login", {
      auth: "none",
      method: "POST",
      summary: "Authenticate a user and create a session-backed JWT token.",
      handler: async (context) => {
        const authService = createAuthService(
          context.databases.primary,
          context.config
        )
        return jsonResponse(
          await authService.login(context.request.jsonBody, getRequestMeta(context.request.headers))
        )
      },
    }),
    defineExternalRoute("/auth/register/request-otp", {
      auth: "none",
      method: "POST",
      summary: "Send a registration OTP to the requested destination.",
      handler: async (context) =>
        jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).requestRegisterOtp(context.request.jsonBody)
        ),
    }),
    defineExternalRoute("/auth/register/verify-otp", {
      auth: "none",
      method: "POST",
      summary: "Verify a registration OTP before account creation.",
      handler: async (context) =>
        jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).verifyRegisterOtp(context.request.jsonBody)
        ),
    }),
    defineExternalRoute("/auth/register", {
      auth: "none",
      method: "POST",
      summary: "Create a new app-owned account after OTP verification.",
      handler: async (context) =>
        jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).register(context.request.jsonBody)
        ),
    }),
    defineExternalRoute("/auth/password-reset/request-otp", {
      auth: "none",
      method: "POST",
      summary: "Send an OTP for password reset.",
      handler: async (context) =>
        jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).requestPasswordResetOtp(context.request.jsonBody)
        ),
    }),
    defineExternalRoute("/auth/password-reset/confirm", {
      auth: "none",
      method: "POST",
      summary: "Confirm a password reset using the OTP code.",
      handler: async (context) =>
        jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).confirmPasswordReset(context.request.jsonBody)
        ),
    }),
    defineExternalRoute("/auth/account-recovery/request-otp", {
      auth: "none",
      method: "POST",
      summary: "Send an account recovery OTP for disabled accounts.",
      handler: async (context) =>
        jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).requestAccountRecoveryOtp(context.request.jsonBody)
        ),
    }),
    defineExternalRoute("/auth/account-recovery/restore", {
      auth: "none",
      method: "POST",
      summary: "Restore an inactive account using the recovery OTP.",
      handler: async (context) =>
        jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).restoreAccount(context.request.jsonBody)
        ),
    }),
    defineExternalRoute("/auth/me", {
      auth: "external",
      summary: "Resolve the authenticated user from the current bearer token.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).getAuthenticatedUser(token)
        )
      },
    }),
    defineExternalRoute("/auth/logout", {
      auth: "external",
      method: "POST",
      summary: "Revoke the current session token.",
      handler: async (context) => {
        const token = readBearerToken(context.request.headers)

        if (!token) {
          return jsonResponse({ error: "Authorization bearer token is required." }, 401)
        }

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).logout(token)
        )
      },
    }),
  ]
}
