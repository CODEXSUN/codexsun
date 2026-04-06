import { randomInt, randomUUID } from "node:crypto"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { signJwt, verifyJwt } from "../../../framework/src/runtime/security/jwt.js"
import {
  hashPassword,
  verifyPassword,
} from "../../../framework/src/runtime/security/password.js"
import type {
  ActorType,
  AuthAccountRecoveryRequestResponse,
  AuthPermissionListResponse,
  AuthPermissionResponse,
  AuthAccountRecoveryRestoreResponse,
  AuthRoleListResponse,
  AuthRoleResponse,
  AuthPasswordResetConfirmResponse,
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
  authPasswordResetConfirmPayloadSchema,
  authPasswordResetConfirmResponseSchema,
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
  authRegisterPayloadSchema,
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

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly mailboxService: MailboxService,
    private readonly config: ServerConfig
  ) {}

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

    if (!parsedPayload.password) {
      throw new ApplicationError("Password is required for a new user.", {}, 400)
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

    const user = await this.repository.create({
      id: randomUUID(),
      email: normalizedEmail,
      phoneNumber: parsedPayload.phoneNumber,
      displayName: parsedPayload.displayName.trim(),
      actorType: parsedPayload.actorType,
      avatarUrl:
        parsedPayload.avatarUrl ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(parsedPayload.displayName.trim())}&background=1f2937&color=ffffff`,
      passwordHash: await hashPassword(parsedPayload.password),
      organizationName: parsedPayload.organizationName,
      roleKeys,
      isSuperAdmin: parsedPayload.isSuperAdmin,
      isActive: parsedPayload.isActive,
    })

    return authUserResponseSchema.parse({
      item: this.applyConfiguredSuperAdminAccess(user),
    })
  }

  async updateAdminUser(userId: string, payload: unknown) {
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
      actorType: "staff",
      channel: parsedPayload.channel,
      destination,
    })

    const verification = await this.repository.createContactVerification({
      id: randomUUID(),
      purpose: "workspace_registration",
      actorType: "staff",
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
      await this.mailboxService.sendTemplatedEmail(
        {
          to: [
            {
              email: destination,
              name: parsedPayload.displayName?.trim() || "Workspace User",
            },
          ],
          templateCode: "workspace_registration_otp",
          templateData: {
            displayName: parsedPayload.displayName?.trim() || "Workspace User",
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
        actorType: "staff",
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

  async register(payload: unknown): Promise<AuthTokenResponse> {
    const parsedPayload = authRegisterPayloadSchema.parse(payload)
    const actorType =
      parsedPayload.actorType === "customer"
        ? "customer"
        : parsedPayload.actorType === "vendor"
          ? "vendor"
          : parsedPayload.actorType === "staff"
            ? "staff"
            : null

    if (!actorType) {
      throw new ApplicationError(
        "Public registration is limited to staff, customer, and vendor accounts.",
        { actorType: parsedPayload.actorType },
        403
      )
    }

    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const verification = await this.repository.getContactVerification(
      parsedPayload.emailVerificationId
    )

    this.assertVerifiedRegistrationContact(verification, normalizedEmail)

    const existingUsers = await this.repository.findByEmail(normalizedEmail)

    if (existingUsers.length > 0) {
      throw new ApplicationError(
        "An account already exists for this email.",
        { email: normalizedEmail },
        409
      )
    }

    const user = await this.repository.create({
      id: randomUUID(),
      email: normalizedEmail,
      phoneNumber: this.normalizePhoneNumber(parsedPayload.phoneNumber),
      displayName: parsedPayload.displayName.trim(),
      actorType,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(parsedPayload.displayName.trim())}&background=1f2937&color=ffffff`,
      passwordHash: await hashPassword(parsedPayload.password),
      organizationName: parsedPayload.organizationName?.trim() ?? null,
      roleKeys: [this.resolveDefaultPortalRoleKey(actorType)],
      isSuperAdmin: false,
    })

    await this.repository.consumeContactVerification(verification!.id)

    return this.createAuthResponse(user)
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

  async login(
    payload: unknown,
    requestMeta: {
      ipAddress: string | null
      userAgent: string | null
    }
  ): Promise<AuthTokenResponse> {
    const parsedPayload = authLoginPayloadSchema.parse(payload)
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const storedUsers = await this.repository.findByEmail(normalizedEmail)

    if (storedUsers.length === 0) {
      throw new ApplicationError("Invalid credentials.", { email: normalizedEmail }, 401)
    }

    let storedUser = null

    for (const candidate of storedUsers) {
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
      throw new ApplicationError("Invalid credentials.", { email: normalizedEmail }, 401)
    }

    if (!storedUser.user.isActive) {
      throw new ApplicationError("This account is disabled.", { id: storedUser.user.id }, 403)
    }

    return this.createAuthResponse(storedUser.user, requestMeta)
  }

  async getAuthenticatedUser(token: string) {
    const claims = this.readTokenClaims(token)
    const session = await this.repository.findSessionById(claims.sid)

    if (!session || session.tokenId !== claims.jti) {
      throw new ApplicationError("Authentication session was not found.", {}, 401)
    }

    if (session.revokedAt) {
      throw new ApplicationError("Authentication session has been revoked.", {}, 401)
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
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
      throw new ApplicationError("This account is disabled.", { userId: session.userId }, 403)
    }

    await this.repository.markSessionSeen(session.id)

    return this.applyConfiguredSuperAdminAccess(storedUser.user)
  }

  async logout(token: string) {
    const claims = this.readTokenClaims(token)
    await this.repository.revokeSession(claims.sid)
    return authLogoutResponseSchema.parse({
      revoked: true,
    } satisfies AuthLogoutResponse)
  }

  async requestPasswordResetOtp(
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

    return this.createEmailOtp({
      email: storedUser.user.email,
      displayName: storedUser.user.displayName,
      actorType: storedUser.user.actorType,
      purpose: "password_reset",
      templateCode: "password_reset_otp",
      responseSchema: authPasswordResetRequestResponseSchema,
    })
  }

  async confirmPasswordReset(
    payload: unknown
  ): Promise<AuthPasswordResetConfirmResponse> {
    const parsedPayload = authPasswordResetConfirmPayloadSchema.parse(payload)
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const verification = await this.repository.getContactVerification(
      parsedPayload.verificationId
    )

    this.assertOpenVerification(verification, "password_reset", normalizedEmail)

    const storedUser = await this.findSingleUserByEmail(normalizedEmail)

    if (!storedUser.user.isActive) {
      throw new ApplicationError(
        "This account is disabled. Use account recovery instead.",
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

    await this.repository.updatePasswordHash(
      storedUser.user.id,
      await hashPassword(parsedPayload.newPassword)
    )
    await this.repository.markContactVerificationVerified(verification!.id)
    await this.repository.consumeContactVerification(verification!.id)

    return authPasswordResetConfirmResponseSchema.parse({
      updated: true,
    } satisfies AuthPasswordResetConfirmResponse)
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

  private async createEmailOtp<TResponse extends {
    verificationId: string
    expiresAt: string
    debugOtp: string | null
  }>(input: {
    email: string
    displayName: string
    actorType: ActorType
    purpose: "password_reset" | "account_recovery"
    templateCode: "password_reset_otp" | "account_recovery_otp"
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

    await this.mailboxService.sendTemplatedEmail(
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
        "The OTP has expired. Request a new code.",
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
}
