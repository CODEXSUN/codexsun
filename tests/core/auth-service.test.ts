import assert from "node:assert/strict"
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

test("auth service supports seeded login, otp registration, password reset, recovery, and session revocation", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-auth-service-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.notifications.email.enabled = false
    config.auth.otpDebug = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const authService = createAuthService(runtime.primary, config)
      const mailboxService = createMailboxService(runtime.primary, config)
      const authRepository = new AuthRepository(runtime.primary)

      const adminLogin = await authService.login(
        {
          email: "sundar@sundar.com",
          password: "Kalarani1@@",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "node:test",
        }
      )

      assert.equal(adminLogin.user.actorType, "admin")
      assert.equal(adminLogin.user.isSuperAdmin, true)
      assert.ok(adminLogin.accessToken.length > 20)
      assert.equal(
        (await authService.getAuthenticatedUser(adminLogin.accessToken)).email,
        "sundar@sundar.com"
      )

      await authService.logout(adminLogin.accessToken)

      await assert.rejects(
        () => authService.getAuthenticatedUser(adminLogin.accessToken),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 401 &&
          error.message.includes("revoked")
      )

      const registerOtp = await authService.requestRegisterOtp({
        channel: "email",
        destination: "new.user@example.com",
      })

      assert.ok(registerOtp.debugOtp)

      const verifyOtp = await authService.verifyRegisterOtp({
        verificationId: registerOtp.verificationId,
        otp: registerOtp.debugOtp!,
      })

      assert.equal(verifyOtp.verified, true)

      const registration = await authService.register({
        email: "new.user@example.com",
        phoneNumber: "9876543210",
        password: "Signup@12345",
        displayName: "New User",
        actorType: "staff",
        emailVerificationId: registerOtp.verificationId,
        organizationName: "codexsun",
      })

      assert.equal(registration.user.actorType, "staff")

      const resetOtp = await authService.requestPasswordResetOtp({
        email: "new.user@example.com",
      })

      assert.ok(resetOtp.debugOtp)

      const resetConfirmation = await authService.confirmPasswordReset({
        email: "new.user@example.com",
        verificationId: resetOtp.verificationId,
        otp: resetOtp.debugOtp!,
        newPassword: "Updated@12345",
      })

      assert.equal(resetConfirmation.updated, true)

      const updatedLogin = await authService.login(
        {
          email: "new.user@example.com",
          password: "Updated@12345",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "node:test",
        }
      )

      assert.equal(updatedLogin.user.email, "new.user@example.com")

      const customerResetOtp = await authService.requestPasswordResetOtp({
        email: "customer@codexsun.local",
      })
      const customerResetVerification = await authRepository.getContactVerification(
        customerResetOtp.verificationId
      )

      assert.equal(customerResetVerification?.actorType, "customer")

      await authRepository.setUserActiveState(updatedLogin.user.id, false)

      const recoveryOtp = await authService.requestAccountRecoveryOtp({
        email: "new.user@example.com",
      })

      assert.ok(recoveryOtp.debugOtp)

      const recovery = await authService.restoreAccount({
        email: "new.user@example.com",
        verificationId: recoveryOtp.verificationId,
        otp: recoveryOtp.debugOtp!,
      })

      assert.equal(recovery.restored, true)

      const mailboxMessages = await mailboxService.listMessages()
      assert.ok(mailboxMessages.items.length >= 3)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("auth service locks accounts after repeated failed logins and audits the lockout", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-auth-lockout-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.notifications.email.enabled = false
    config.security.authMaxLoginAttempts = 2
    config.security.authLockoutMinutes = 5
    config.operations.audit.adminAuditEnabled = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const authService = createAuthService(runtime.primary, config)

      await assert.rejects(
        () =>
          authService.login(
            {
              email: "sundar@sundar.com",
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
              email: "sundar@sundar.com",
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
              email: "sundar@sundar.com",
              password: "Kalarani1@@",
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

test("auth service revokes stale admin sessions and records an audit event", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-auth-idle-session-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.security.adminSessionIdleMinutes = 1
    config.operations.audit.adminAuditEnabled = true

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const authService = createAuthService(runtime.primary, config)
      const authRepository = new AuthRepository(runtime.primary)

      const login = await authService.login(
        {
          email: "sundar@sundar.com",
          password: "Kalarani1@@",
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
