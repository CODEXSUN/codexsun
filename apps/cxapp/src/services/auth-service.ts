import { randomInt, randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { writeActivityLog } from "../../../framework/src/runtime/activity-log/activity-log-service.js"
import { signJwt, verifyJwt } from "../../../framework/src/runtime/security/jwt.js"
import {
  hashPassword,
  verifyPassword,
} from "../../../framework/src/runtime/security/password.js"
import type {
  ActorType,
  AuthAccountRecoveryRequestResponse,
  AuthAccountRecoveryRestoreResponse,
  AuthPasswordLinkCompleteResponse,
  AuthPermissionListResponse,
  AuthPermissionResponse,
  AuthRoleListResponse,
  AuthRoleResponse,
  AuthPasswordResetRequestResponse,
  AuthRegisterOtpRequestResponse,
  AuthRegisterOtpVerifyResponse,
  AuthSessionListResponse,
  AuthTokenResponse,
  AuthUser,
  AuthUserListResponse,
} from "../../shared/index.js"
import {
  authAccountRecoveryRequestPayloadSchema,
  authAccountRecoveryRequestResponseSchema,
  authAccountRecoveryRestorePayloadSchema,
  authAccountRecoveryRestoreResponseSchema,
  authLoginPayloadSchema,
  authLogoutResponseSchema,
  authPasswordLinkCompletePayloadSchema,
  authPasswordLinkCompleteResponseSchema,
  authPermissionListResponseSchema,
  authPermissionResponseSchema,
  authRoleListResponseSchema,
  authRoleResponseSchema,
  authPasswordResetRequestPayloadSchema,
  authPasswordResetRequestResponseSchema,
  authRoleUpsertPayloadSchema,
  authPermissionUpsertPayloadSchema,
  authRegisterOtpRequestPayloadSchema,
  authRegisterOtpRequestResponseSchema,
  authRegisterOtpVerifyPayloadSchema,
  authRegisterOtpVerifyResponseSchema,
  authSessionListResponseSchema,
  authTokenResponseSchema,
  authUserListResponseSchema,
  authUserResponseSchema,
  authUserUpsertPayloadSchema,
  type AuthLogoutResponse,
} from "../../shared/index.js"

import {
  AuthRepository,
  type ContactVerificationRecord,
  type StoredAuthUser,
} from "../repositories/auth-repository.js"
import { MailboxService } from "./mailbox-service.js"

type TokenClaims = {
  email: string
  actorType: ActorType
  sid: string
  jti: string
  sub: string
  exp: number
  iat: number
}

type PasswordLinkPurpose = "password_reset" | "password_setup"
const authEmailWaitThresholdMs = 2_000

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly mailboxService: MailboxService,
    private readonly config: ServerConfig,
    private readonly database: Kysely<unknown>
  ) {}

  private async sendTemplatedEmailWithDeliveryPolicy(
    input: Parameters<MailboxService["sendTemplatedEmail"]>[0],
    options?: Parameters<MailboxService["sendTemplatedEmail"]>[1]
  ) {
    const delivery = this.mailboxService.sendTemplatedEmail(input, options)

    if (this.config.auth.otpDebug) {
      void delivery.catch((error) => {
        console.error("Background debug email delivery failed.", error)
      })
      return
    }

    let timedOut = false

    await Promise.race([
      delivery,
      new Promise<void>((resolve) => {
        setTimeout(() => {
          timedOut = true
          resolve()
        }, authEmailWaitThresholdMs)
      }),
    ])

    if (!timedOut) {
      return
    }

    void delivery.catch((error) => {
      console.error("Background auth email delivery failed.", error)
    })
  }

  async listUsers() {
    const items = (await this.repository.listUsers()).map((entry) =>
      this.applyConfiguredSuperAdminAccess(entry.user)
    )
    return authUserListResponseSchema.parse({
      items,
    } satisfies AuthUserListResponse)
  }

  async listSessions() {
    const items = await this.repository.listSessions()
    return authSessionListResponseSchema.parse({
      items,
    } satisfies AuthSessionListResponse)
  }

  async listRoles() {
    const items = await this.repository.listRoles()
    return authRoleListResponseSchema.parse({
      items,
    } satisfies AuthRoleListResponse)
  }

  async listPermissions() {
    const items = await this.repository.listPermissions()
    return authPermissionListResponseSchema.parse({
      items,
    } satisfies AuthPermissionListResponse)
  }

  async getPermission(permissionId: string) {
    const permission = await this.repository.getPermission(permissionId)

    if (!permission) {
      throw new ApplicationError("Permission could not be found.", { permissionId }, 404)
    }

    return authPermissionResponseSchema.parse({
      item: permission,
    } satisfies AuthPermissionResponse)
  }

  async getRole(roleId: string) {
    const role = await this.repository.getRole(roleId)

    if (!role) {
      throw new ApplicationError("Role could not be found.", { roleId }, 404)
    }

    return authRoleResponseSchema.parse({
      item: role,
    } satisfies AuthRoleResponse)
  }

  async getUser(userId: string) {
    const storedUser = await this.repository.findById(userId)

    if (!storedUser) {
      throw new ApplicationError("User could not be found.", { userId }, 404)
    }

    return authUserResponseSchema.parse({
      item: this.applyConfiguredSuperAdminAccess(storedUser.user),
    })
  }

  async createAdminUser(payload: unknown) {
    const parsedPayload = authUserUpsertPayloadSchema.parse(payload)
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const existingUsers = await this.repository.findByEmail(normalizedEmail)

    if (existingUsers.length > 0) {
      throw new ApplicationError(
        "An account already exists for this email.",
        { email: normalizedEmail },
        409
      )
    }

    const roleKeys = await this.assertAssignableRoles(
      parsedPayload.actorType,
      parsedPayload.roleKeys
    )

    if (parsedPayload.isSuperAdmin && parsedPayload.actorType !== "admin") {
      throw new ApplicationError(
        "Only admin users can be marked as super admin.",
        { actorType: parsedPayload.actorType },
        400
      )
    }

    const temporaryPassword = randomUUID()
    const user = await this.repository.create({
      id: randomUUID(),
      email: normalizedEmail,
      phoneNumber: parsedPayload.phoneNumber,
      displayName: parsedPayload.displayName.trim(),
      actorType: parsedPayload.actorType,
      avatarUrl:
        parsedPayload.avatarUrl ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(parsedPayload.displayName.trim())}&background=1f2937&color=ffffff`,
      passwordHash: await hashPassword(temporaryPassword),
      organizationName: parsedPayload.organizationName,
      roleKeys,
      isSuperAdmin: parsedPayload.isSuperAdmin,
      isActive: parsedPayload.isActive,
    })

    try {
      await this.sendPasswordLink({
        email: user.email,
        displayName: user.displayName,
        actorType: user.actorType,
        purpose: "password_setup",
        templateCode: "workspace_password_setup_link",
        intent: "invite",
      })
    } catch (error) {
      await this.repository.deleteUser(user.id)
      throw error
    }

    return authUserResponseSchema.parse({
      item: this.applyConfiguredSuperAdminAccess(user),
    })
  }

  async updateAdminUser(input: {
    actingUser: AuthUser
    userId: string
    payload: unknown
  }) {
    const { actingUser, userId, payload } = input
    const parsedPayload = authUserUpsertPayloadSchema.parse(payload)
    const storedUser = await this.repository.findById(userId)

    if (!storedUser) {
      throw new ApplicationError("User could not be found.", { userId }, 404)
    }

    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const existingUsers = await this.repository.findByEmail(normalizedEmail)

    if (existingUsers.some((entry) => entry.user.id !== userId)) {
      throw new ApplicationError(
        "Another account already uses this email.",
        { email: normalizedEmail },
        409
      )
    }

    const roleKeys = await this.assertAssignableRoles(
      parsedPayload.actorType,
      parsedPayload.roleKeys
    )

    if (parsedPayload.isSuperAdmin && parsedPayload.actorType !== "admin") {
      throw new ApplicationError(
        "Only admin users can be marked as super admin.",
        { actorType: parsedPayload.actorType },
        400
      )
    }

    if (parsedPayload.password && !actingUser.isSuperAdmin) {
      throw new ApplicationError(
        "Only super admins can change another user's password directly.",
        { actingUserId: actingUser.id, userId },
        403
      )
    }

    await this.repository.updateUser({
      id: userId,
      email: normalizedEmail,
      phoneNumber: parsedPayload.phoneNumber,
      displayName: parsedPayload.displayName.trim(),
      actorType: parsedPayload.actorType,
      avatarUrl:
        parsedPayload.avatarUrl ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(parsedPayload.displayName.trim())}&background=1f2937&color=ffffff`,
      organizationName: parsedPayload.organizationName,
      isSuperAdmin: parsedPayload.isSuperAdmin,
      isActive: parsedPayload.isActive,
    })

    if (parsedPayload.password) {
      await this.repository.updatePasswordHash(
        userId,
        await hashPassword(parsedPayload.password)
      )
    }

    await this.repository.replaceUserRoles(userId, roleKeys)

    const nextUser = await this.repository.findById(userId)

    if (!nextUser) {
      throw new ApplicationError("Updated user could not be found.", { userId }, 500)
    }

    return authUserResponseSchema.parse({
      item: this.applyConfiguredSuperAdminAccess(nextUser.user),
    })
  }

  async sendAdminPasswordResetLink(input: {
    actingUser: AuthUser
    userId: string
  }): Promise<AuthPasswordResetRequestResponse> {
    if (!input.actingUser.isSuperAdmin) {
      throw new ApplicationError(
        "Only super admins can send password reset links for users.",
        { actingUserId: input.actingUser.id, userId: input.userId },
        403
      )
    }

    const storedUser = await this.repository.findById(input.userId)

    if (!storedUser) {
      throw new ApplicationError("User could not be found.", { userId: input.userId }, 404)
    }

    return this.requestPasswordResetLink({
      email: storedUser.user.email,
    })
  }

  async deleteAdminUser(input: {
    actingUser: AuthUser
    userId: string
  }) {
    if (!input.actingUser.isSuperAdmin) {
      throw new ApplicationError(
        "Only super admins can permanently delete users.",
        { userId: input.userId },
        403
      )
    }

    if (input.actingUser.id === input.userId) {
      throw new ApplicationError(
        "You cannot delete the current signed-in admin account.",
        { userId: input.userId },
        409
      )
    }

    const storedUser = await this.repository.findById(input.userId)

    if (!storedUser) {
      throw new ApplicationError("User could not be found.", { userId: input.userId }, 404)
    }

    if (storedUser.user.isSuperAdmin) {
      throw new ApplicationError(
        "Super admin accounts cannot be deleted from this action.",
        { userId: input.userId },
        409
      )
    }

    await this.repository.deleteUser(input.userId)

    return {
      deleted: true as const,
    }
  }

  async createRole(payload: unknown) {
    const parsedPayload = authRoleUpsertPayloadSchema.parse(payload)
    const permissionKeys = await this.assertAssignablePermissions(parsedPayload.permissionKeys)
    const roleKey = parsedPayload.key?.trim() || this.createRoleKey(parsedPayload.name)
    const existingRole = await this.repository.getRole(roleKey)

    if (existingRole) {
      throw new ApplicationError("A role already exists for this key.", { roleKey }, 409)
    }

    const role = await this.repository.createRole({
      key: roleKey,
      name: parsedPayload.name.trim(),
      summary: parsedPayload.summary.trim(),
      actorType: parsedPayload.actorType,
      permissionKeys,
      isActive: parsedPayload.isActive,
    })

    if (!role) {
      throw new ApplicationError("Created role could not be found.", { roleKey }, 500)
    }

    return authRoleResponseSchema.parse({
      item: role,
    } satisfies AuthRoleResponse)
  }

  async updateRole(roleId: string, payload: unknown) {
    const parsedPayload = authRoleUpsertPayloadSchema.parse(payload)
    const role = await this.repository.getRole(roleId)

    if (!role) {
      throw new ApplicationError("Role could not be found.", { roleId }, 404)
    }

    const permissionKeys = await this.assertAssignablePermissions(parsedPayload.permissionKeys)

    await this.repository.updateRole({
      id: roleId,
      name: parsedPayload.name.trim(),
      summary: parsedPayload.summary.trim(),
      actorType: parsedPayload.actorType,
      isActive: parsedPayload.isActive,
    })
    await this.repository.replaceRolePermissions(roleId, permissionKeys)

    const nextRole = await this.repository.getRole(roleId)

    if (!nextRole) {
      throw new ApplicationError("Updated role could not be found.", { roleId }, 500)
    }

    return authRoleResponseSchema.parse({
      item: nextRole,
    } satisfies AuthRoleResponse)
  }

  async createPermission(payload: unknown) {
    const parsedPayload = authPermissionUpsertPayloadSchema.parse(payload)
    const permissionKey = parsedPayload.key?.trim() || this.createPermissionKey(parsedPayload)
    const existingPermission = await this.repository.getPermission(permissionKey)

    if (existingPermission) {
      throw new ApplicationError(
        "A permission already exists for this key.",
        { permissionKey },
        409
      )
    }

    const permission = await this.repository.createPermission({
      key: permissionKey,
      name: parsedPayload.name.trim(),
      summary: parsedPayload.summary.trim(),
      scopeType: parsedPayload.scopeType,
      appId: parsedPayload.appId?.trim() || null,
      resourceKey: parsedPayload.resourceKey.trim(),
      actionKey: parsedPayload.actionKey.trim(),
      route: parsedPayload.route?.trim() || null,
      isActive: parsedPayload.isActive,
    })

    if (!permission) {
      throw new ApplicationError(
        "Created permission could not be found.",
        { permissionKey },
        500
      )
    }

    return authPermissionResponseSchema.parse({
      item: permission,
    } satisfies AuthPermissionResponse)
  }

  async updatePermission(permissionId: string, payload: unknown) {
    const parsedPayload = authPermissionUpsertPayloadSchema.parse(payload)
    const permission = await this.repository.getPermission(permissionId)

    if (!permission) {
      throw new ApplicationError(
        "Permission could not be found.",
        { permissionId },
        404
      )
    }

    await this.repository.updatePermission({
      id: permissionId,
      name: parsedPayload.name.trim(),
      summary: parsedPayload.summary.trim(),
      scopeType: parsedPayload.scopeType,
      appId: parsedPayload.appId?.trim() || null,
      resourceKey: parsedPayload.resourceKey.trim(),
      actionKey: parsedPayload.actionKey.trim(),
      route: parsedPayload.route?.trim() || null,
      isActive: parsedPayload.isActive,
    })

    const nextPermission = await this.repository.getPermission(permissionId)

    if (!nextPermission) {
      throw new ApplicationError(
        "Updated permission could not be found.",
        { permissionId },
        500
      )
    }

    return authPermissionResponseSchema.parse({
      item: nextPermission,
    } satisfies AuthPermissionResponse)
  }

  async requestRegisterOtp(payload: unknown): Promise<AuthRegisterOtpRequestResponse> {
    const parsedPayload = authRegisterOtpRequestPayloadSchema.parse(payload)

    if (parsedPayload.channel !== "email") {
      throw new ApplicationError(
        "Mobile OTP is currently disabled. Use email OTP verification instead.",
        { channel: parsedPayload.channel },
        400
      )
    }

    const destination = parsedPayload.destination.trim().toLowerCase()
    const existingUsers = await this.repository.findByEmail(destination)

    if (existingUsers.length > 0) {
      throw new ApplicationError(
        "An account already exists for this email.",
        { email: destination },
        409
      )
    }

    const otp = String(randomInt(100000, 1_000_000))
    const otpHash = await hashPassword(otp)
    const expiresAt = new Date(
      Date.now() + this.config.auth.otpExpiryMinutes * 60_000
    ).toISOString()

    await this.repository.deactivatePendingContactVerifications({
      purpose: "workspace_registration",
      actorType: parsedPayload.actorType,
      channel: parsedPayload.channel,
      destination,
    })

    const verification = await this.repository.createContactVerification({
      id: randomUUID(),
      purpose: "workspace_registration",
      actorType: parsedPayload.actorType,
      channel: parsedPayload.channel,
      destination,
      otpHash,
      expiresAt,
      metadata: {
        email: destination,
      },
    })

    if (!verification) {
      throw new ApplicationError("Failed to create verification session.", {}, 500)
    }

    try {
      await this.sendTemplatedEmailWithDeliveryPolicy(
        {
          to: [
            {
              email: destination,
              name: parsedPayload.displayName?.trim() || "Customer",
            },
          ],
          templateCode: "workspace_registration_otp",
          templateData: {
            displayName: parsedPayload.displayName?.trim() || "Customer",
            otp,
            expiryMinutes: this.config.auth.otpExpiryMinutes,
          },
          referenceType: "workspace_registration",
          referenceId: verification.id,
        },
        { allowDebugFallback: true }
      )
    } catch (error) {
      await this.repository.deactivatePendingContactVerifications({
        purpose: "workspace_registration",
        actorType: parsedPayload.actorType,
        channel: "email",
        destination,
      })
      throw error
    }

    return authRegisterOtpRequestResponseSchema.parse({
      verificationId: verification.id,
      expiresAt: verification.expiresAt,
      debugOtp: this.config.auth.otpDebug ? otp : null,
    } satisfies AuthRegisterOtpRequestResponse)
  }

  async verifyRegisterOtp(payload: unknown): Promise<AuthRegisterOtpVerifyResponse> {
    const parsedPayload = authRegisterOtpVerifyPayloadSchema.parse(payload)
    const verification = await this.repository.getContactVerification(
      parsedPayload.verificationId
    )

    this.assertOpenVerification(verification, "workspace_registration")

    if (verification!.verifiedAt) {
      return authRegisterOtpVerifyResponseSchema.parse({
        verificationId: verification!.id,
        verified: true,
      } satisfies AuthRegisterOtpVerifyResponse)
    }

    const otpMatches = await verifyPassword(
      parsedPayload.otp,
      verification!.otpHash
    )

    if (!otpMatches) {
      await this.repository.incrementContactVerificationAttempts(verification!.id)
      throw new ApplicationError(
        "Invalid OTP. Check the code and try again.",
        { verificationId: verification!.id },
        400
      )
    }

    await this.repository.markContactVerificationVerified(verification!.id)

    return authRegisterOtpVerifyResponseSchema.parse({
      verificationId: verification!.id,
      verified: true,
    } satisfies AuthRegisterOtpVerifyResponse)
  }

  async createPortalUser(input: {
    email: string
    phoneNumber: string
    password: string
    displayName: string
    actorType: "customer" | "staff" | "vendor"
    organizationName?: string | null
  }) {
    const normalizedEmail = input.email.trim().toLowerCase()
    const existingUsers = await this.repository.findByEmail(normalizedEmail)

    if (existingUsers.length > 0) {
      throw new ApplicationError(
        "An account already exists for this email.",
        { email: normalizedEmail },
        409
      )
    }

    return this.repository.create({
      id: randomUUID(),
      email: normalizedEmail,
      phoneNumber: this.normalizePhoneNumber(input.phoneNumber),
      displayName: input.displayName.trim(),
      actorType: input.actorType,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(input.displayName.trim())}&background=1f2937&color=ffffff`,
      passwordHash: await hashPassword(input.password),
      organizationName: input.organizationName?.trim() || null,
      roleKeys: [this.resolveDefaultPortalRoleKey(input.actorType)],
      isSuperAdmin: false,
    })
  }

  async assertVerifiedRegistrationEmail(verificationId: string, email: string) {
    const verification = await this.repository.getContactVerification(verificationId)
    this.assertVerifiedRegistrationContact(
      verification,
      email.trim().toLowerCase()
    )
  }

  async consumeVerifiedRegistrationEmail(verificationId: string) {
    await this.repository.consumeContactVerification(verificationId)
  }

  async login(
    payload: unknown,
    requestMeta: {
      ipAddress: string | null
      userAgent: string | null
    } = {
      ipAddress: null,
      userAgent: null,
    }
  ): Promise<AuthTokenResponse> {
    const parsedPayload = authLoginPayloadSchema.parse(payload)
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const storedUsers = await this.repository.findByEmail(normalizedEmail)

    if (storedUsers.length === 0) {
      await this.writeAuthAudit({
        action: "login_failed",
        level: "warn",
        message: "Login failed because the account email was not found.",
        actorEmail: normalizedEmail,
        details: {
          reason: "email_not_found",
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
        },
      })
      throw new ApplicationError("Invalid credentials.", { email: normalizedEmail }, 401)
    }

    let storedUser = null

    for (const candidate of storedUsers) {
      await this.assertNotLocked(candidate, normalizedEmail, requestMeta)
      const passwordMatches = await verifyPassword(
        parsedPayload.password,
        candidate.passwordHash
      )

      if (passwordMatches) {
        storedUser = candidate
        break
      }
    }

    if (!storedUser) {
      await this.handleFailedLoginAttempt(storedUsers, normalizedEmail, requestMeta)
      throw new ApplicationError("Invalid credentials.", { email: normalizedEmail }, 401)
    }

    if (!storedUser.user.isActive) {
      await this.writeAuthAudit({
        action: "login_blocked",
        level: "warn",
        message: "Login was blocked because the account is disabled.",
        actorId: storedUser.user.id,
        actorEmail: storedUser.user.email,
        actorType: storedUser.user.actorType,
        details: {
          reason: "account_disabled",
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
        },
      })
      throw new ApplicationError("This account is disabled.", { id: storedUser.user.id }, 403)
    }

    if (storedUser.failedLoginCount > 0 || storedUser.lockedUntil) {
      await this.repository.clearFailedLoginState(storedUser.user.id)
    }

    await this.writeAuthAudit({
      action: "login_succeeded",
      message: "Authentication succeeded and a new session was issued.",
      actorId: storedUser.user.id,
      actorEmail: storedUser.user.email,
      actorType: storedUser.user.actorType,
      details: {
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
      },
    })

    return this.createAuthResponse(storedUser.user, requestMeta)
  }

  async getAuthenticatedUser(token: string) {
    const claims = this.readTokenClaims(token)
    const session = await this.repository.findSessionById(claims.sid)

    if (!session || session.tokenId !== claims.jti) {
      await this.writeAuthAudit({
        action: "session_rejected",
        level: "warn",
        message: "Authentication failed because the session record was not found.",
        actorId: claims.sub,
        actorEmail: claims.email,
        actorType: claims.actorType,
        details: {
          reason: "session_not_found",
          sessionId: claims.sid,
        },
      })
      throw new ApplicationError("Authentication session was not found.", {}, 401)
    }

    if (session.revokedAt) {
      await this.writeAuthAudit({
        action: "session_rejected",
        level: "warn",
        message: "Authentication failed because the session was revoked.",
        actorId: claims.sub,
        actorEmail: claims.email,
        actorType: claims.actorType,
        details: {
          reason: "session_revoked",
          sessionId: session.id,
        },
      })
      throw new ApplicationError("Authentication session has been revoked.", {}, 401)
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await this.repository.revokeSession(session.id)
      await this.writeAuthAudit({
        action: "session_rejected",
        level: "warn",
        message: "Authentication failed because the session expired.",
        actorId: claims.sub,
        actorEmail: claims.email,
        actorType: claims.actorType,
        details: {
          reason: "session_expired",
          sessionId: session.id,
        },
      })
      throw new ApplicationError("Authentication session has expired.", {}, 401)
    }

    const storedUser = await this.repository.findById(session.userId)

    if (!storedUser) {
      throw new ApplicationError(
        "Authenticated user no longer exists.",
        { userId: session.userId },
        404
      )
    }

    if (!storedUser.user.isActive) {
      await this.repository.revokeSessionsForUser(storedUser.user.id)
      await this.writeAuthAudit({
        action: "session_rejected",
        level: "warn",
        message: "Authentication failed because the account is disabled.",
        actorId: storedUser.user.id,
        actorEmail: storedUser.user.email,
        actorType: storedUser.user.actorType,
        details: {
          reason: "account_disabled",
          sessionId: session.id,
        },
      })
      throw new ApplicationError("This account is disabled.", { userId: session.userId }, 403)
    }

    await this.assertSessionStillActive(storedUser, session)

    await this.repository.markSessionSeen(session.id)

    return this.applyConfiguredSuperAdminAccess(storedUser.user)
  }

  async logout(token: string) {
    const claims = this.readTokenClaims(token)
    await this.repository.revokeSession(claims.sid)
    await this.writeAuthAudit({
      action: "logout",
      message: "Authentication session was revoked through logout.",
      actorId: claims.sub,
      actorEmail: claims.email,
      actorType: claims.actorType,
      details: {
        sessionId: claims.sid,
      },
    })
    return authLogoutResponseSchema.parse({
      revoked: true,
    } satisfies AuthLogoutResponse)
  }

  async requestPasswordResetLink(
    payload: unknown
  ): Promise<AuthPasswordResetRequestResponse> {
    const parsedPayload = authPasswordResetRequestPayloadSchema.parse(payload)
    const storedUser = await this.findSingleUserByEmail(parsedPayload.email)

    if (!storedUser.user.isActive) {
      throw new ApplicationError(
        "This account is disabled. Use account recovery instead.",
        { email: storedUser.user.email },
        409
      )
    }

    return this.sendPasswordLink({
      email: storedUser.user.email,
      displayName: storedUser.user.displayName,
      actorType: storedUser.user.actorType,
      purpose: "password_reset",
      templateCode: "password_reset_link",
      intent: "reset",
    })
  }

  async completePasswordLink(
    payload: unknown
  ): Promise<AuthPasswordLinkCompleteResponse> {
    const parsedPayload = authPasswordLinkCompletePayloadSchema.parse(payload)
    const verification = await this.repository.getContactVerification(
      parsedPayload.verificationId
    )

    const purpose = this.assertPasswordLinkVerification(verification)
    const tokenMatches = await verifyPassword(parsedPayload.token, verification!.otpHash)

    if (!tokenMatches) {
      await this.repository.incrementContactVerificationAttempts(verification!.id)
      throw new ApplicationError(
        "This password link is invalid. Request a new email and try again.",
        { verificationId: verification!.id },
        400
      )
    }

    const storedUser = await this.findSingleUserByEmail(verification!.destination)

    if (purpose === "password_reset" && !storedUser.user.isActive) {
      throw new ApplicationError(
        "This account is disabled. Use account recovery instead.",
        { email: storedUser.user.email },
        409
      )
    }

    await this.repository.updatePasswordHash(
      storedUser.user.id,
      await hashPassword(parsedPayload.newPassword)
    )
    await this.repository.markContactVerificationVerified(verification!.id)
    await this.repository.consumeContactVerification(verification!.id)

    return authPasswordLinkCompleteResponseSchema.parse({
      updated: true,
    } satisfies AuthPasswordLinkCompleteResponse)
  }

  async requestAccountRecoveryOtp(
    payload: unknown
  ): Promise<AuthAccountRecoveryRequestResponse> {
    const parsedPayload = authAccountRecoveryRequestPayloadSchema.parse(payload)
    const storedUser = await this.findSingleUserByEmail(parsedPayload.email)

    if (storedUser.user.isActive) {
      throw new ApplicationError(
        "This account is already active.",
        { email: storedUser.user.email },
        409
      )
    }

    return this.createEmailOtp({
      email: storedUser.user.email,
      displayName: storedUser.user.displayName,
      actorType: storedUser.user.actorType,
      purpose: "account_recovery",
      templateCode: "account_recovery_otp",
      responseSchema: authAccountRecoveryRequestResponseSchema,
    })
  }

  async restoreAccount(
    payload: unknown
  ): Promise<AuthAccountRecoveryRestoreResponse> {
    const parsedPayload = authAccountRecoveryRestorePayloadSchema.parse(payload)
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const verification = await this.repository.getContactVerification(
      parsedPayload.verificationId
    )

    this.assertOpenVerification(verification, "account_recovery", normalizedEmail)

    const storedUser = await this.findSingleUserByEmail(normalizedEmail)

    if (storedUser.user.isActive) {
      throw new ApplicationError(
        "This account is already active.",
        { email: normalizedEmail },
        409
      )
    }

    const otpMatches = await verifyPassword(parsedPayload.otp, verification!.otpHash)

    if (!otpMatches) {
      await this.repository.incrementContactVerificationAttempts(verification!.id)
      throw new ApplicationError(
        "Invalid OTP. Check the code and try again.",
        { verificationId: verification!.id },
        400
      )
    }

    await this.repository.markContactVerificationVerified(verification!.id)
    await this.repository.consumeContactVerification(verification!.id)
    await this.repository.setUserActiveState(storedUser.user.id, true)

    return authAccountRecoveryRestoreResponseSchema.parse({
      restored: true,
    } satisfies AuthAccountRecoveryRestoreResponse)
  }

  private async createAuthResponse(
    user: AuthUser,
    requestMeta: {
      ipAddress: string | null
      userAgent: string | null
    } = {
      ipAddress: null,
      userAgent: null,
    }
  ) {
    const normalizedUser = this.applyConfiguredSuperAdminAccess(user)
    const sessionId = randomUUID()
    const tokenId = randomUUID()
    const expiresInSeconds = this.config.security.jwtExpiresInSeconds
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1_000).toISOString()

    await this.repository.createSession({
      id: sessionId,
      userId: user.id,
      tokenId,
      actorType: user.actorType,
      expiresAt,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    })

    const accessToken = signJwt(
      {
        email: normalizedUser.email,
        actorType: normalizedUser.actorType,
        sid: sessionId,
        jti: tokenId,
      },
      {
        secret: this.config.security.jwtSecret,
        subject: normalizedUser.id,
        expiresInSeconds,
      }
    )

    return authTokenResponseSchema.parse({
      accessToken,
      tokenType: "Bearer",
      expiresInSeconds,
      expiresAt,
      sessionId,
      user: normalizedUser,
    } satisfies AuthTokenResponse)
  }

  private applyConfiguredSuperAdminAccess(user: AuthUser): AuthUser {
    if (user.isSuperAdmin) {
      return user
    }

    if (!this.config.auth.superAdminEmails.includes(user.email.toLowerCase())) {
      return user
    }

    return {
      ...user,
      isSuperAdmin: true,
    }
  }

  private async sendPasswordLink(input: {
    email: string
    displayName: string
    actorType: ActorType
    purpose: PasswordLinkPurpose
    templateCode: "password_reset_link" | "workspace_password_setup_link"
    intent: "invite" | "reset"
  }) {
    const token = `${randomUUID()}${randomUUID()}`.replace(/-/g, "")
    const expiresAt = new Date(
      Date.now() + this.config.auth.otpExpiryMinutes * 60_000
    ).toISOString()

    await this.repository.deactivatePendingContactVerifications({
      purpose: input.purpose,
      actorType: input.actorType,
      channel: "email",
      destination: input.email,
    })

    const verification = await this.repository.createContactVerification({
      id: randomUUID(),
      purpose: input.purpose,
      actorType: input.actorType,
      channel: "email",
      destination: input.email,
      otpHash: await hashPassword(token),
      expiresAt,
      metadata: {
        intent: input.intent,
      },
    })

    if (!verification) {
      throw new ApplicationError("Failed to create verification session.", {}, 500)
    }

    const actionUrl = this.resolveAbsoluteUrl(
      `/password-setup?verificationId=${encodeURIComponent(verification.id)}&token=${encodeURIComponent(token)}&intent=${encodeURIComponent(input.intent)}`
    )

    try {
      await this.sendTemplatedEmailWithDeliveryPolicy(
        {
          to: [{ email: input.email, name: input.displayName }],
          templateCode: input.templateCode,
          templateData: {
            displayName: input.displayName,
            actionUrl,
            actionLabel:
              input.intent === "reset" ? "Reset password" : "Create password",
            expiryMinutes: this.config.auth.otpExpiryMinutes,
          },
          referenceType: input.purpose,
          referenceId: verification.id,
        },
        { allowDebugFallback: true }
      )
    } catch (error) {
      await this.repository.deactivatePendingContactVerifications({
        purpose: input.purpose,
        actorType: input.actorType,
        channel: "email",
        destination: input.email,
      })
      throw error
    }

    return authPasswordResetRequestResponseSchema.parse({
      sent: true,
      expiresAt: verification.expiresAt,
      debugUrl: this.config.auth.otpDebug ? actionUrl : null,
    })
  }

  private async createEmailOtp<TResponse extends {
    verificationId: string
    expiresAt: string
    debugOtp: string | null
  }>(input: {
    email: string
    displayName: string
    actorType: ActorType
    purpose: "account_recovery"
    templateCode: "account_recovery_otp"
    responseSchema: { parse: (value: unknown) => TResponse }
  }) {
    const otp = String(randomInt(100000, 1_000_000))
    const expiresAt = new Date(
      Date.now() + this.config.auth.otpExpiryMinutes * 60_000
    ).toISOString()

    await this.repository.deactivatePendingContactVerifications({
      purpose: input.purpose,
      actorType: input.actorType,
      channel: "email",
      destination: input.email,
    })

    const verification = await this.repository.createContactVerification({
      id: randomUUID(),
      purpose: input.purpose,
      actorType: input.actorType,
      channel: "email",
      destination: input.email,
      otpHash: await hashPassword(otp),
      expiresAt,
    })

    if (!verification) {
      throw new ApplicationError("Failed to create verification session.", {}, 500)
    }

    await this.sendTemplatedEmailWithDeliveryPolicy(
      {
        to: [{ email: input.email, name: input.displayName }],
        templateCode: input.templateCode,
        templateData: {
          displayName: input.displayName,
          otp,
          expiryMinutes: this.config.auth.otpExpiryMinutes,
        },
        referenceType: input.purpose,
        referenceId: verification.id,
      },
      { allowDebugFallback: true }
    )

    return input.responseSchema.parse({
      verificationId: verification.id,
      expiresAt: verification.expiresAt,
      debugOtp: this.config.auth.otpDebug ? otp : null,
    })
  }

  private resolveFrontendOrigin() {
    const configuredHost = this.config.frontendDomain.trim() || "localhost"

    if (configuredHost.startsWith("http://") || configuredHost.startsWith("https://")) {
      return configuredHost.replace(/\/$/, "")
    }

    const protocol = this.config.tlsEnabled ? "https" : "http"
    const port = this.config.tlsEnabled
      ? this.config.frontendHttpsPort
      : this.config.frontendHttpPort
    const defaultPort =
      (this.config.tlsEnabled && port === 443) ||
      (!this.config.tlsEnabled && port === 80)

    return `${protocol}://${configuredHost}${defaultPort ? "" : `:${port}`}`
  }

  private resolveAbsoluteUrl(href: string) {
    return new URL(href, `${this.resolveFrontendOrigin()}/`).toString()
  }

  private assertOpenVerification(
    verification: ContactVerificationRecord | null,
    purpose: string,
    expectedDestination?: string
  ) {
    if (!verification || !verification.isActive || verification.purpose !== purpose) {
      throw new ApplicationError("Verification session could not be found.", {}, 404)
    }

    if (expectedDestination && verification.destination !== expectedDestination) {
      throw new ApplicationError(
        "Verification does not match this email.",
        { destination: expectedDestination },
        400
      )
    }

    if (verification.consumedAt) {
      throw new ApplicationError(
        "This verification session has already been used.",
        { verificationId: verification.id },
        409
      )
    }

    if (new Date(verification.expiresAt).getTime() < Date.now()) {
      throw new ApplicationError(
        "This verification has expired. Request a new email and try again.",
        { verificationId: verification.id },
        410
      )
    }
  }

  private assertVerifiedRegistrationContact(
    verification: ContactVerificationRecord | null,
    expectedEmail: string
  ) {
    this.assertOpenVerification(verification, "workspace_registration", expectedEmail)

    if (!verification?.verifiedAt) {
      throw new ApplicationError(
        "Verify the OTP before completing registration.",
        { email: expectedEmail },
        400
      )
    }
  }

  private assertPasswordLinkVerification(
    verification: ContactVerificationRecord | null
  ): PasswordLinkPurpose {
    if (
      !verification ||
      (verification.purpose !== "password_reset" &&
        verification.purpose !== "password_setup")
    ) {
      throw new ApplicationError("Password link could not be found.", {}, 404)
    }

    this.assertOpenVerification(verification, verification.purpose, verification.destination)

    return verification.purpose
  }

  private async findSingleUserByEmail(email: string): Promise<StoredAuthUser> {
    const normalizedEmail = email.trim().toLowerCase()
    const storedUsers = await this.repository.findByEmail(normalizedEmail)

    if (storedUsers.length === 0) {
      throw new ApplicationError(
        "No account exists for this email.",
        { email: normalizedEmail },
        404
      )
    }

    return storedUsers[0]!
  }

  private normalizePhoneNumber(value: string) {
    const trimmed = value.trim()
    const digits = trimmed.replace(/\D/g, "")

    if (!digits) {
      throw new ApplicationError(
        "Enter a valid mobile number.",
        { phoneNumber: value },
        400
      )
    }

    if (digits.length === 10) {
      return `+91${digits}`
    }

    if (digits.length < 11 || digits.length > 15) {
      throw new ApplicationError(
        "Enter a valid mobile number.",
        { phoneNumber: value },
        400
      )
    }

    return `+${digits}`
  }

  private resolveDefaultPortalRoleKey(actorType: "customer" | "staff" | "vendor") {
    return actorType === "customer"
      ? "customer_portal"
      : actorType === "vendor"
        ? "vendor_portal"
        : "staff_operator"
  }

  private readTokenClaims(token: string) {
    return verifyJwt<TokenClaims>(token, {
      secret: this.config.security.jwtSecret,
    })
  }

  private async assertAssignableRoles(actorType: ActorType, roleKeys: ReadonlyArray<string>) {
    const roles = await this.repository.listRoles()
    const selectedRoles = roles.filter((role) => roleKeys.includes(role.key))

    if (selectedRoles.length !== roleKeys.length) {
      throw new ApplicationError(
        "One or more selected roles are invalid.",
        { roleKeys },
        400
      )
    }

    if (selectedRoles.some((role) => role.actorType !== actorType)) {
      throw new ApplicationError(
        "Selected roles must match the chosen actor type.",
        { actorType, roleKeys },
        400
      )
    }

    if (selectedRoles.some((role) => !role.isActive)) {
      throw new ApplicationError(
        "Selected roles must stay active.",
        { roleKeys },
        400
      )
    }

    return selectedRoles.map((role) => role.key)
  }

  private async assertAssignablePermissions(permissionKeys: ReadonlyArray<string>) {
    const permissions = await this.repository.listPermissions()
    const selectedPermissions = permissions.filter((permission) =>
      permissionKeys.includes(permission.key)
    )

    if (selectedPermissions.length !== permissionKeys.length) {
      throw new ApplicationError(
        "One or more selected permissions are invalid.",
        { permissionKeys },
        400
      )
    }

    if (selectedPermissions.some((permission) => !permission.isActive)) {
      throw new ApplicationError(
        "Selected permissions must stay active.",
        { permissionKeys },
        400
      )
    }

    return selectedPermissions.map((permission) => permission.key)
  }

  private createRoleKey(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_{2,}/g, "_")
  }

  private createPermissionKey(input: {
    actionKey: string
    appId: string | null
    resourceKey: string
    scopeType: string
  }) {
    const namespace = input.appId?.trim() || input.scopeType.trim()
    const resource = input.resourceKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
    const action = input.actionKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")

    return `${namespace}:${resource}:${action}`
  }

  private async handleFailedLoginAttempt(
    storedUsers: StoredAuthUser[],
    normalizedEmail: string,
    requestMeta: {
      ipAddress: string | null
      userAgent: string | null
    }
  ) {
    const maxAttempts = Math.max(1, this.config.security.authMaxLoginAttempts)
    const lockoutMinutes = Math.max(1, this.config.security.authLockoutMinutes)

    for (const candidate of storedUsers) {
      const nextFailedLoginCount = candidate.failedLoginCount + 1
      const lockedUntil =
        nextFailedLoginCount >= maxAttempts
          ? new Date(Date.now() + lockoutMinutes * 60_000).toISOString()
          : null

      await this.repository.recordFailedLoginAttempt(candidate.user.id, {
        failedLoginCount: nextFailedLoginCount,
        lockedUntil,
      })

      await this.writeAuthAudit({
        action: lockedUntil ? "login_locked" : "login_failed",
        level: "warn",
        message: lockedUntil
          ? "Login attempts exceeded the configured threshold and the account was locked temporarily."
          : "Login failed because the password did not match.",
        actorId: candidate.user.id,
        actorEmail: normalizedEmail,
        actorType: candidate.user.actorType,
        details: {
          failedLoginCount: nextFailedLoginCount,
          maxAttempts,
          lockedUntil,
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
          reason: lockedUntil ? "account_locked" : "invalid_password",
        },
      })
    }
  }

  private async assertNotLocked(
    storedUser: StoredAuthUser,
    normalizedEmail: string,
    requestMeta: {
      ipAddress: string | null
      userAgent: string | null
    }
  ) {
    if (!storedUser.lockedUntil) {
      return
    }

    const lockedUntilMs = new Date(storedUser.lockedUntil).getTime()

    if (Number.isFinite(lockedUntilMs) && lockedUntilMs > Date.now()) {
      await this.writeAuthAudit({
        action: "login_blocked",
        level: "warn",
        message: "Login was blocked because the account is temporarily locked.",
        actorId: storedUser.user.id,
        actorEmail: normalizedEmail,
        actorType: storedUser.user.actorType,
        details: {
          reason: "account_locked",
          lockedUntil: storedUser.lockedUntil,
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
        },
      })
      throw new ApplicationError(
        "This account is temporarily locked. Try again later.",
        { lockedUntil: storedUser.lockedUntil },
        423
      )
    }

    await this.repository.clearFailedLoginState(storedUser.user.id)
  }

  private async assertSessionStillActive(storedUser: StoredAuthUser, session: { id: string; lastSeenAt: string | null }) {
    const shouldEnforceIdleTimeout =
      storedUser.user.actorType === "admin" || storedUser.user.actorType === "staff"

    if (!shouldEnforceIdleTimeout) {
      return
    }

    const lastSeenAt = session.lastSeenAt ?? null
    if (!lastSeenAt) {
      return
    }

    const idleThresholdMs = this.config.security.adminSessionIdleMinutes * 60_000
    if (idleThresholdMs <= 0) {
      return
    }

    const idleForMs = Date.now() - new Date(lastSeenAt).getTime()
    if (!Number.isFinite(idleForMs) || idleForMs < idleThresholdMs) {
      return
    }

    await this.repository.revokeSession(session.id)
    await this.writeAuthAudit({
      action: "session_rejected",
      level: "warn",
      message: "Authentication failed because the admin session was idle beyond the allowed timeout.",
      actorId: storedUser.user.id,
      actorEmail: storedUser.user.email,
      actorType: storedUser.user.actorType,
      details: {
        reason: "session_idle_timeout",
        sessionId: session.id,
        lastSeenAt,
        idleThresholdMinutes: this.config.security.adminSessionIdleMinutes,
      },
    })

    throw new ApplicationError("Authentication session has expired due to inactivity.", {}, 401)
  }

  private async writeAuthAudit(input: {
    action: string
    message: string
    level?: "info" | "warn" | "error"
    actorId?: string | null
    actorEmail?: string | null
    actorType?: string | null
    details?: Record<string, unknown>
  }) {
    if (!this.config.operations.audit.adminAuditEnabled) {
      return
    }

    await writeActivityLog(this.database, {
      category: "auth",
      action: input.action,
      level: input.level ?? "info",
      message: input.message,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      actorType: input.actorType ?? null,
      context: input.details ?? null,
    })
  }
}
