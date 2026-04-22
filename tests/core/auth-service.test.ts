import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { AuthRepository } from "../../apps/cxapp/src/repositories/auth-repository.js"
import {
  createAuthService,
  createMailboxService,
} from "../../apps/cxapp/src/services/service-factory.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import { ApplicationError } from "../../apps/framework/src/runtime/errors/application-error.js"
import { listActivityLogs } from "../../apps/framework/src/runtime/activity-log/activity-log-service.js"
import { hashPassword } from "../../apps/framework/src/runtime/security/password.js"

function disableOfflineIfPresent(config: Record<string, unknown>) {
  const offline = config.offline as { enabled?: boolean } | undefined

  if (offline) {
    offline.enabled = false
  }
}

function disableNotificationsIfPresent(config: Record<string, unknown>) {
  const notifications = config.notifications as
    | {
        email?: {
          enabled?: boolean
        }
      }
    | undefined

  if (notifications?.email) {
    notifications.email.enabled = false
  }
}

function readPasswordLinkPayload(debugUrl: string) {
  const url = new URL(debugUrl)
  const verificationId = url.searchParams.get("verificationId")
  const token = url.searchParams.get("token")

  assert.ok(verificationId)
  assert.ok(token)

  return {
    verificationId,
    token,
  }
}

test(
  "auth service supports seeded login, otp registration, password reset, recovery, and session revocation",
  { concurrency: false },
  async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-auth-service-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    disableOfflineIfPresent(config as unknown as Record<string, unknown>)
    disableNotificationsIfPresent(config as unknown as Record<string, unknown>)
    config.auth.otpDebug = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const authService = createAuthService(runtime.primary, config)
      const mailboxService = createMailboxService(runtime.primary, config)
      const authRepository = new AuthRepository(runtime.primary)
      const superAdmin = await authRepository.findById("auth-user:platform-admin")
      const userEmail = `new.user+${randomUUID()}@example.com`
      const customerEmail = `customer+${randomUUID()}@codexsun.local`

      assert.ok(superAdmin)

      await authRepository.create({
        id: `auth-user:test-customer:${randomUUID()}`,
        email: customerEmail,
        phoneNumber: "+919876543212",
        displayName: "Customer Demo",
        actorType: "customer",
        avatarUrl: null,
        passwordHash: await hashPassword("Customer@12345"),
        organizationName: "Loomline Retail",
        roleKeys: ["customer_portal"],
        isSuperAdmin: false,
        isActive: true,
      })

      const registerOtp = await authService.requestRegisterOtp({
        channel: "email",
        destination: userEmail,
      })

      assert.ok(registerOtp.debugOtp)

      const verifyOtp = await authService.verifyRegisterOtp({
        verificationId: registerOtp.verificationId,
        otp: registerOtp.debugOtp!,
      })

      assert.equal(verifyOtp.verified, true)

      const registration = await authService.createAdminUser({
        email: userEmail,
        phoneNumber: "9876543210",
        displayName: "New User",
        actorType: "staff",
        organizationName: "codexsun",
        avatarUrl: null,
        roleKeys: ["staff_operator"],
        isActive: true,
        isSuperAdmin: false,
      })

      assert.equal(registration.item.actorType, "staff")

      const resetLink = await authService.requestPasswordResetLink({
        email: userEmail,
      })
      const resetPayload = readPasswordLinkPayload(resetLink.debugUrl!)

      const resetConfirmation = await authService.completePasswordLink({
        verificationId: resetPayload.verificationId,
        token: resetPayload.token,
        newPassword: "Updated@12345",
      })

      assert.equal(resetConfirmation.updated, true)

      const updatedLogin = await authService.login(
        {
          email: userEmail,
          password: "Updated@12345",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "node:test",
        }
      )

      assert.equal(updatedLogin.user.email, userEmail)

      const directPasswordUpdate = await authService.updateAdminUser({
        actingUser: superAdmin.user,
        userId: updatedLogin.user.id,
        payload: {
          email: updatedLogin.user.email,
          phoneNumber: updatedLogin.user.phoneNumber,
          displayName: updatedLogin.user.displayName,
          actorType: updatedLogin.user.actorType,
          avatarUrl: updatedLogin.user.avatarUrl,
          organizationName: updatedLogin.user.organizationName,
          roleKeys: updatedLogin.user.roles.map((role) => role.key),
          password: "SuperAdmin@123",
          isActive: updatedLogin.user.isActive,
          isSuperAdmin: updatedLogin.user.isSuperAdmin,
        },
      })

      assert.equal(directPasswordUpdate.item.id, updatedLogin.user.id)

      const superAdminUpdatedLogin = await authService.login(
        {
          email: userEmail,
          password: "SuperAdmin@123",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "node:test",
        }
      )

      assert.equal(superAdminUpdatedLogin.user.id, updatedLogin.user.id)

      await assert.rejects(
        () =>
          authService.updateAdminUser({
            actingUser: superAdminUpdatedLogin.user,
            userId: updatedLogin.user.id,
            payload: {
              email: updatedLogin.user.email,
              phoneNumber: updatedLogin.user.phoneNumber,
              displayName: updatedLogin.user.displayName,
              actorType: updatedLogin.user.actorType,
              avatarUrl: updatedLogin.user.avatarUrl,
              organizationName: updatedLogin.user.organizationName,
              roleKeys: updatedLogin.user.roles.map((role) => role.key),
              password: "Blocked@123",
              isActive: updatedLogin.user.isActive,
              isSuperAdmin: updatedLogin.user.isSuperAdmin,
            },
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 403 &&
          error.message.includes("Only super admins can change another user's password directly")
      )

      const adminResetLink = await authService.sendAdminPasswordResetLink({
        actingUser: superAdmin.user,
        userId: updatedLogin.user.id,
      })

      assert.equal(adminResetLink.sent, true)
      assert.ok(adminResetLink.debugUrl)

      await assert.rejects(
        () =>
          authService.sendAdminPasswordResetLink({
            actingUser: superAdminUpdatedLogin.user,
            userId: updatedLogin.user.id,
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 403 &&
          error.message.includes("Only super admins can send password reset links for users")
      )

      const customerResetLink = await authService.requestPasswordResetLink({
        email: customerEmail,
      })
      const customerResetVerification = await authRepository.getContactVerification(
        readPasswordLinkPayload(customerResetLink.debugUrl!).verificationId
      )

      assert.equal(customerResetVerification?.actorType, "customer")

      await authRepository.setUserActiveState(updatedLogin.user.id, false)

      const recoveryOtp = await authService.requestAccountRecoveryOtp({
        email: userEmail,
      })

      assert.ok(recoveryOtp.debugOtp)

      const recovery = await authService.restoreAccount({
        email: userEmail,
        verificationId: recoveryOtp.verificationId,
        otp: recoveryOtp.debugOtp!,
      })

      assert.equal(recovery.restored, true)

      const restoredLogin = await authService.login(
        {
          email: userEmail,
          password: "SuperAdmin@123",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "node:test",
        }
      )

      assert.equal(restoredLogin.user.actorType, "staff")
      assert.ok(restoredLogin.accessToken.length > 20)
      assert.equal(
        (await authService.getAuthenticatedUser(restoredLogin.accessToken)).email,
        userEmail
      )

      await authService.logout(restoredLogin.accessToken)

      await assert.rejects(
        () => authService.getAuthenticatedUser(restoredLogin.accessToken),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 401 &&
          error.message.includes("revoked")
      )

      const mailboxMessages = await mailboxService.listMessages()
      assert.ok(mailboxMessages.items.length >= 3)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test(
  "auth service locks accounts after repeated failed logins and audits the lockout",
  { concurrency: false },
  async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-auth-lockout-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    disableOfflineIfPresent(config as unknown as Record<string, unknown>)
    disableNotificationsIfPresent(config as unknown as Record<string, unknown>)
    config.security.authMaxLoginAttempts = 2
    config.security.authLockoutMinutes = 5
    config.operations.audit.adminAuditEnabled = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const authService = createAuthService(runtime.primary, config)
      const authRepository = new AuthRepository(runtime.primary)
      const lockoutUserId = `auth-user:test-lockout:${randomUUID()}`
      const lockoutEmail = `lockout.user+${randomUUID()}@example.com`
      const lockoutPassword = "Lockout@12345"

      await authRepository.create({
        id: lockoutUserId,
        email: lockoutEmail,
        phoneNumber: "+919876543210",
        displayName: "Lockout User",
        actorType: "staff",
        avatarUrl: null,
        passwordHash: await hashPassword(lockoutPassword),
        organizationName: "codexsun",
        roleKeys: ["staff_operator"],
        isSuperAdmin: false,
        isActive: true,
      })

      await assert.rejects(
        () =>
          authService.login(
            {
              email: lockoutEmail,
              password: "wrong-password",
            },
            {
              ipAddress: "127.0.0.1",
              userAgent: "node:test",
            }
          ),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 401 &&
          error.message.includes("Invalid credentials")
      )

      await assert.rejects(
        () =>
          authService.login(
            {
              email: lockoutEmail,
              password: "wrong-password",
            },
            {
              ipAddress: "127.0.0.1",
              userAgent: "node:test",
            }
          ),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 401 &&
          error.message.includes("Invalid credentials")
      )

      await assert.rejects(
        () =>
          authService.login(
            {
              email: lockoutEmail,
              password: lockoutPassword,
            },
            {
              ipAddress: "127.0.0.1",
              userAgent: "node:test",
            }
          ),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 423 &&
          error.message.includes("temporarily locked")
      )

      const activityLogs = await listActivityLogs(runtime.primary, {
        category: "auth",
        limit: 10,
      })

      assert.ok(activityLogs.items.some((item) => item.action === "login_failed"))
      assert.ok(activityLogs.items.some((item) => item.action === "login_locked"))
      assert.ok(
        activityLogs.items.some(
          (item) =>
            item.action === "login_blocked" &&
            item.context?.reason === "account_locked"
        )
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test(
  "auth service revokes stale admin sessions and records an audit event",
  { concurrency: false },
  async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-auth-idle-session-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    disableOfflineIfPresent(config as unknown as Record<string, unknown>)
    disableNotificationsIfPresent(config as unknown as Record<string, unknown>)
    config.security.adminSessionIdleMinutes = 1
    config.operations.audit.adminAuditEnabled = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const authService = createAuthService(runtime.primary, config)
      const authRepository = new AuthRepository(runtime.primary)
      const sessionUser = await authRepository.create({
        id: `auth-user:test-idle-session:${randomUUID()}`,
        email: `idle.session+${randomUUID()}@example.com`,
        phoneNumber: "+919876543211",
        displayName: "Idle Session User",
        actorType: "staff",
        avatarUrl: null,
        passwordHash: await hashPassword("Idle@12345"),
        organizationName: "codexsun",
        roleKeys: ["staff_operator"],
        isSuperAdmin: false,
        isActive: true,
      })

      const login = await authService.login(
        {
          email: sessionUser.email,
          password: "Idle@12345",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "node:test",
        }
      )

      await authRepository.setSessionLastSeen(
        login.sessionId,
        new Date(Date.now() - 5 * 60 * 1000).toISOString()
      )

      await assert.rejects(
        () => authService.getAuthenticatedUser(login.accessToken),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 401 &&
          error.message.includes("due to inactivity")
      )

      const storedSession = await authRepository.findSessionById(login.sessionId)
      assert.ok(storedSession?.revokedAt)

      const activityLogs = await listActivityLogs(runtime.primary, {
        category: "auth",
        limit: 10,
      })

      assert.ok(
        activityLogs.items.some(
          (item) =>
            item.action === "session_rejected" &&
            item.context?.reason === "session_idle_timeout"
        )
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
