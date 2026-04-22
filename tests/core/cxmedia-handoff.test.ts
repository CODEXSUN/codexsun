import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { AuthRepository } from "../../apps/cxapp/src/repositories/auth-repository.js"
import { createAuthService } from "../../apps/cxapp/src/services/service-factory.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import { verifyJwt } from "../../apps/framework/src/runtime/security/jwt.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

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

test("auth service creates a short-lived trusted cxmedia handoff URL for the signed-in user", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-auth-cxmedia-handoff-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    disableOfflineIfPresent(config as unknown as Record<string, unknown>)
    disableNotificationsIfPresent(config as unknown as Record<string, unknown>)
    config.media.cxmedia.enabled = true
    config.media.cxmedia.baseUrl = "http://cxmedia.local:4100"
    config.media.cxmedia.handoffSecret = "handoff-secret-123456"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const authRepository = new AuthRepository(runtime.primary)
      const authService = createAuthService(runtime.primary, config)
      const [storedAdmin] = await authRepository.findByEmail("sundar@sundar.com")

      assert.ok(storedAdmin)

      const response = await authService.createCxmediaLaunchUrl(storedAdmin!.user)
      const url = new URL(response.url)
      const handoffToken = url.searchParams.get("handoff")

      assert.equal(`${url.origin}${url.pathname}`, "http://cxmedia.local:4100/")
      assert.ok(handoffToken)

      const claims = verifyJwt<{
        email: string
        name: string
        role: string
        type: string
      }>(handoffToken!, {
        secret: "handoff-secret-123456",
      })

      assert.equal(claims.email, "sundar@sundar.com")
      assert.equal(claims.type, "cxmedia-handoff")
      assert.equal(claims.sub, storedAdmin!.user.id)
      assert.equal(claims.exp! > claims.iat!, true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
