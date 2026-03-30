import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { AuthRepository } from "../../apps/core/src/repositories/auth-repository.js"
import {
  createAuthService,
  createMailboxService,
} from "../../apps/core/src/services/service-factory.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import { ApplicationError } from "../../apps/framework/src/runtime/errors/application-error.js"

test("auth service supports seeded login, otp registration, password reset, recovery, and session revocation", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-auth-service-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const authService = createAuthService(runtime.primary, config)
      const mailboxService = createMailboxService(runtime.primary, config)
      const authRepository = new AuthRepository(runtime.primary)

      const adminLogin = await authService.login(
        {
          email: "admin@codexsun.local",
          password: "Admin@12345",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "node:test",
        }
      )

      assert.equal(adminLogin.user.actorType, "admin")
      assert.ok(adminLogin.accessToken.length > 20)
      assert.equal(
        (await authService.getAuthenticatedUser(adminLogin.accessToken)).email,
        "admin@codexsun.local"
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
