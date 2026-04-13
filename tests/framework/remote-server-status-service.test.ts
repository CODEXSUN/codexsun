import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import {
  createRemoteServerTarget,
  generateRemoteServerTargetSecret,
  getRemoteServerDashboard,
} from "../../apps/framework/src/runtime/operations/remote-server-status-service.js"

test("remote server dashboard accepts a pasted remote monitor secret on create", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-remote-server-create-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await createRemoteServerTarget(
        runtime.primary,
        {
          name: "Techmedia Production",
          baseUrl: "https://app.techmedia.test",
          description: "Remote server with manual shared secret.",
          monitorSecret: "manual-remote-secret",
        },
        "owner@example.com"
      )

      const dashboard = await getRemoteServerDashboard(config, runtime.primary, {
        fetcher: async (input, init) => {
          assert.equal(input, "https://app.techmedia.test/api/v1/framework/server-status")
          assert.deepEqual(init?.headers, {
            "x-codexsun-monitor-key": "manual-remote-secret",
          })

          return new Response(
            JSON.stringify({
              status: "live",
              generatedAt: "2026-04-13T12:30:00.000Z",
              appName: "techmedia",
              appVersion: "0.0.1",
              environment: "production",
              appDomain: "api.techmedia.test",
              frontendDomain: "app.techmedia.test",
              appHttpPort: 4000,
              frontendHttpPort: 4173,
              databaseDriver: "mariadb",
              databaseName: "techmedia_prod",
              gitSyncEnabled: true,
              gitBranch: "main",
              gitStatus: "clean",
              canAutoUpdate: true,
              hasRemoteUpdate: false,
              latestUpdateMessage: "Deploy techmedia live status changes",
              latestUpdateTimestamp: "2026-04-13T12:00:00.000Z",
              healthUrl: "https://api.techmedia.test/health",
              databaseReachable: true,
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          )
        },
      })

      assert.equal(dashboard.summary.total, 1)
      assert.equal(dashboard.summary.live, 1)
      assert.equal(dashboard.items[0]?.target.hasMonitorSecret, true)
      assert.equal(dashboard.items[0]?.status, "live")
      assert.ok(dashboard.items[0]?.target.confirmedAt)
      assert.equal(dashboard.items[0]?.snapshot?.appVersion, "0.0.1")
      assert.equal(dashboard.items[0]?.snapshot?.gitStatus, "clean")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("remote server dashboard uses isolated per-target secrets and confirms matching servers", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-remote-server-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createRemoteServerTarget(
        runtime.primary,
        {
          name: "Codexsun Production",
          baseUrl: "https://app.codexsun.test",
          description: "Primary production server.",
        },
        "owner@example.com"
      )

      const pendingDashboard = await getRemoteServerDashboard(config, runtime.primary)

      assert.equal(pendingDashboard.summary.total, 1)
      assert.equal(pendingDashboard.summary.pendingSecret, 1)
      assert.equal(pendingDashboard.items[0]?.status, "pending_secret")
      assert.equal(pendingDashboard.items[0]?.target.hasMonitorSecret, false)

      const generated = await generateRemoteServerTargetSecret(
        runtime.primary,
        created.item.id,
        "owner@example.com"
      )

      const dashboard = await getRemoteServerDashboard(config, runtime.primary, {
        fetcher: async (input, init) => {
          assert.equal(input, "https://app.codexsun.test/api/v1/framework/server-status")
          assert.equal(init?.headers instanceof Headers, false)
          assert.deepEqual(init?.headers, {
            "x-codexsun-monitor-key": generated.generatedSecret,
          })

          return new Response(
            JSON.stringify({
              status: "live",
              generatedAt: "2026-04-13T12:00:00.000Z",
              appName: "codexsun",
              appVersion: "0.0.1",
              environment: "production",
              appDomain: "api.codexsun.test",
              frontendDomain: "app.codexsun.test",
              appHttpPort: 4000,
              frontendHttpPort: 4173,
              databaseDriver: "mariadb",
              databaseName: "codexsun_prod",
              gitSyncEnabled: true,
              gitBranch: "main",
              gitStatus: "dirty",
              canAutoUpdate: true,
              hasRemoteUpdate: false,
              latestUpdateMessage: "Refine remote server monitoring",
              latestUpdateTimestamp: "2026-04-13T11:45:00.000Z",
              healthUrl: "https://api.codexsun.test/health",
              databaseReachable: true,
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          )
        },
      })

      assert.equal(dashboard.monitorConfigured, true)
      assert.equal(dashboard.summary.total, 1)
      assert.equal(dashboard.summary.live, 1)
      assert.equal(dashboard.summary.pendingSecret, 0)
      assert.equal(dashboard.items[0]?.target.name, "Codexsun Production")
      assert.equal(dashboard.items[0]?.status, "live")
      assert.equal(dashboard.items[0]?.target.hasMonitorSecret, true)
      assert.ok(dashboard.items[0]?.target.confirmedAt)
      assert.equal(dashboard.items[0]?.snapshot?.databaseName, "codexsun_prod")
      assert.equal(dashboard.items[0]?.snapshot?.latestUpdateMessage, "Refine remote server monitoring")
      assert.equal(dashboard.items[0]?.snapshot?.latestUpdateTimestamp, "2026-04-13T11:45:00.000Z")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
