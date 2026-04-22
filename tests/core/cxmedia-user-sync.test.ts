import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { AuthRepository } from "../../apps/cxapp/src/repositories/auth-repository.js"
import { createAuthService } from "../../apps/cxapp/src/services/service-factory.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
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

test("auth service syncs cxmedia users programmatically when the bridge sync secret is configured", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-auth-cxmedia-sync-"))
  const createdEmail = `media.sync.${Date.now()}@example.com`
  const updatedEmail = `media.sync.updated.${Date.now()}@example.com`
  const originalFetch = global.fetch
  const syncRequests: Array<{
    body: Record<string, unknown>
    url: string
  }> = []

  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const body = init?.body ? JSON.parse(String(init.body)) : {}

    syncRequests.push({
      body,
      url,
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })
  }) as typeof fetch

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    disableOfflineIfPresent(config as unknown as Record<string, unknown>)
    disableNotificationsIfPresent(config as unknown as Record<string, unknown>)
    config.media.cxmedia.enabled = true
    config.media.cxmedia.baseUrl = "http://cxmedia.local"
    config.media.cxmedia.syncSecret = "sync-secret"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const authService = createAuthService(runtime.primary, config)
      const authRepository = new AuthRepository(runtime.primary)
      const createdUser = await authService.createPortalUser({
        actorType: "staff",
        displayName: "Media User",
        email: createdEmail,
        organizationName: "codexsun",
        password: "Media@12345",
        phoneNumber: "9876543210",
      })

      assert.equal(syncRequests[0]?.url, "http://cxmedia.local/api/internal/users/sync")
      assert.equal(syncRequests[0]?.body.email, createdEmail)
      assert.equal(syncRequests[0]?.body.role, "editor")
      assert.equal(typeof syncRequests[0]?.body.passwordHash, "string")

      const storedAdmin = await authRepository.findByEmail("sundar@sundar.com")
      assert.ok(storedAdmin[0])

      await authService.updateAdminUser({
        actingUser: storedAdmin[0]!.user,
        userId: createdUser.id,
        payload: {
          actorType: "staff",
          avatarUrl: createdUser.avatarUrl,
          displayName: "Media User Updated",
          email: updatedEmail,
          isActive: true,
          isSuperAdmin: false,
          organizationName: createdUser.organizationName,
          password: "Media@67890",
          phoneNumber: createdUser.phoneNumber,
          roleKeys: createdUser.roles.map((role) => role.key),
        },
      })

      assert.equal(syncRequests[1]?.url, "http://cxmedia.local/api/internal/users/sync")
      assert.equal(syncRequests[1]?.body.previousEmail, createdEmail)
      assert.equal(syncRequests[1]?.body.email, updatedEmail)
      assert.equal(syncRequests[1]?.body.name, "Media User Updated")

      await authService.deleteAdminUser({
        actingUser: storedAdmin[0]!.user,
        userId: createdUser.id,
      })

      assert.equal(syncRequests[2]?.url, "http://cxmedia.local/api/internal/users/delete")
      assert.equal(syncRequests[2]?.body.email, updatedEmail)
    } finally {
      await runtime.destroy()
    }
  } finally {
    global.fetch = originalFetch
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
