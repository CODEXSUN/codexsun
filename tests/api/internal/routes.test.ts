import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { createInternalApiRoutes } from "../../../apps/api/src/internal/routes.js"
import { createAuthService } from "../../../apps/cxapp/src/services/service-factory.js"
import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"
import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"
import { recordMonitoringEvent } from "../../../apps/framework/src/runtime/monitoring/monitoring-service.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../../apps/framework/src/runtime/database/index.js"

test("internal baseline route exposes the machine-readable workspace host baseline", () => {
  const route = createInternalApiRoutes(createAppSuite()).find(
    (candidate) => candidate.path === "/internal/v1/baseline"
  )

  assert.ok(route)

  const response = route.handler({
    appSuite: createAppSuite(),
    route: {
      auth: route.auth,
      path: route.path,
      surface: route.surface,
      version: route.version,
    },
  })

  assert.ok(!(response instanceof Promise))

  const payload = JSON.parse(response.body) as {
    scope: string
    baseline: {
      activeShell: { appId: string }
      framework: { id: string }
      apps: Array<{ id: string }>
    }
  }

  assert.equal(payload.scope, "internal")
  assert.equal(payload.baseline.activeShell.appId, "cxapp")
  assert.equal(payload.baseline.framework.id, "framework")
  assert.ok(payload.baseline.apps.some((app) => app.id === "ui"))
})

test("internal route registry includes the frappe connector endpoints", () => {
  const routes = createInternalApiRoutes(createAppSuite())
  const routePaths = routes.map((route) => `${route.method} ${route.path}`)

  assert.ok(routePaths.includes("GET /internal/v1/frappe/settings"))
  assert.ok(routePaths.includes("GET /internal/v1/frappe/todos"))
  assert.ok(routePaths.includes("GET /internal/v1/frappe/items"))
  assert.ok(routePaths.includes("POST /internal/v1/frappe/items/sync-products"))
  assert.ok(routePaths.includes("GET /internal/v1/frappe/purchase-receipts"))
})

test("internal route registry includes the billing voucher and report endpoints", () => {
  const routes = createInternalApiRoutes(createAppSuite())
  const routePaths = routes.map((route) => `${route.method} ${route.path}`)

  assert.ok(routePaths.includes("GET /internal/v1/billing/categories"))
  assert.ok(routePaths.includes("GET /internal/v1/billing/category"))
  assert.ok(routePaths.includes("GET /internal/v1/billing/ledgers"))
  assert.ok(routePaths.includes("GET /internal/v1/billing/ledger"))
  assert.ok(routePaths.includes("GET /internal/v1/billing/voucher-groups"))
  assert.ok(routePaths.includes("GET /internal/v1/billing/voucher-types"))
  assert.ok(routePaths.includes("POST /internal/v1/billing/categories"))
  assert.ok(routePaths.includes("POST /internal/v1/billing/voucher-groups"))
  assert.ok(routePaths.includes("POST /internal/v1/billing/voucher-types"))
  assert.ok(routePaths.includes("PATCH /internal/v1/billing/category"))
  assert.ok(routePaths.includes("PATCH /internal/v1/billing/voucher-group"))
  assert.ok(routePaths.includes("PATCH /internal/v1/billing/voucher-type"))
  assert.ok(routePaths.includes("DELETE /internal/v1/billing/category"))
  assert.ok(routePaths.includes("DELETE /internal/v1/billing/voucher-group"))
  assert.ok(routePaths.includes("DELETE /internal/v1/billing/voucher-type"))
  assert.ok(routePaths.includes("POST /internal/v1/billing/category/restore"))
  assert.ok(routePaths.includes("POST /internal/v1/billing/voucher-group/restore"))
  assert.ok(routePaths.includes("POST /internal/v1/billing/voucher-type/restore"))
  assert.ok(routePaths.includes("POST /internal/v1/billing/ledgers"))
  assert.ok(routePaths.includes("PATCH /internal/v1/billing/ledger"))
  assert.ok(routePaths.includes("DELETE /internal/v1/billing/ledger"))
  assert.ok(routePaths.includes("GET /internal/v1/billing/vouchers"))
  assert.ok(routePaths.includes("GET /internal/v1/billing/reports"))
  assert.ok(routePaths.includes("GET /internal/v1/billing/voucher"))
  assert.ok(routePaths.includes("POST /internal/v1/billing/vouchers"))
  assert.ok(routePaths.includes("PATCH /internal/v1/billing/voucher"))
  assert.ok(routePaths.includes("DELETE /internal/v1/billing/voucher"))
})

test("internal route registry includes the core common-module CRUD endpoints", () => {
  const routes = createInternalApiRoutes(createAppSuite())
  const routePaths = routes.map((route) => `${route.method} ${route.path}`)

  assert.ok(routePaths.includes("GET /internal/v1/core/common-modules/metadata"))
  assert.ok(routePaths.includes("GET /internal/v1/core/common-modules/summary"))
  assert.ok(routePaths.includes("GET /internal/v1/core/common-modules/items"))
  assert.ok(routePaths.includes("GET /internal/v1/core/common-modules/item"))
  assert.ok(routePaths.includes("POST /internal/v1/core/common-modules/items"))
  assert.ok(routePaths.includes("PATCH /internal/v1/core/common-modules/item"))
  assert.ok(routePaths.includes("DELETE /internal/v1/core/common-modules/item"))
  assert.ok(routePaths.includes("GET /internal/v1/cxapp/company"))
  assert.ok(routePaths.includes("POST /internal/v1/cxapp/companies"))
  assert.ok(routePaths.includes("PATCH /internal/v1/cxapp/company"))
  assert.ok(routePaths.includes("DELETE /internal/v1/cxapp/company"))
  assert.ok(routePaths.includes("GET /internal/v1/cxapp/auth/users"))
  assert.ok(routePaths.includes("GET /internal/v1/cxapp/auth/user"))
  assert.ok(routePaths.includes("POST /internal/v1/cxapp/auth/users"))
  assert.ok(routePaths.includes("PATCH /internal/v1/cxapp/auth/user"))
  assert.ok(routePaths.includes("GET /internal/v1/cxapp/auth/roles"))
  assert.ok(routePaths.includes("GET /internal/v1/cxapp/auth/role"))
  assert.ok(routePaths.includes("POST /internal/v1/cxapp/auth/roles"))
  assert.ok(routePaths.includes("PATCH /internal/v1/cxapp/auth/role"))
  assert.ok(routePaths.includes("GET /internal/v1/cxapp/auth/permissions"))
  assert.ok(routePaths.includes("GET /internal/v1/cxapp/auth/permission"))
  assert.ok(routePaths.includes("POST /internal/v1/cxapp/auth/permissions"))
  assert.ok(routePaths.includes("PATCH /internal/v1/cxapp/auth/permission"))
  assert.ok(routePaths.includes("GET /internal/v1/cxapp/runtime-settings"))
  assert.ok(routePaths.includes("POST /internal/v1/cxapp/runtime-settings"))
  assert.ok(routePaths.includes("GET /internal/v1/core/products"))
  assert.ok(routePaths.includes("GET /internal/v1/core/product"))
  assert.ok(routePaths.includes("POST /internal/v1/core/products"))
  assert.ok(routePaths.includes("PATCH /internal/v1/core/product"))
  assert.ok(routePaths.includes("DELETE /internal/v1/core/product"))
  assert.ok(routePaths.includes("GET /internal/v1/demo/summary"))
  assert.ok(routePaths.includes("GET /internal/v1/demo/profiles"))
  assert.ok(routePaths.includes("POST /internal/v1/demo/install"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/media"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/media"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/system-update"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/system-update/history"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/system-update"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/system-update/reset"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/activity-log"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/activity-log/test"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/alerts-dashboard"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/database-backups"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/database-backups/run"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/database-backups/restore-drill"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/database-backups/restore"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/security-review"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/security-review/item"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/security-review/complete"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/media-item"))
  assert.ok(routePaths.includes("PATCH /internal/v1/framework/media-item"))
  assert.ok(routePaths.includes("DELETE /internal/v1/framework/media-item"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/media-item/restore"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/media-folders"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/media-folders"))
  assert.ok(routePaths.includes("PATCH /internal/v1/framework/media-folder"))
  assert.ok(routePaths.includes("DELETE /internal/v1/framework/media-folder"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/media-folder/restore"))
  assert.ok(routePaths.includes("GET /internal/v1/ecommerce/communications/health"))
  assert.ok(routePaths.includes("GET /internal/v1/ecommerce/communications"))
  assert.ok(routePaths.includes("GET /internal/v1/ecommerce/orders/report"))
  assert.ok(routePaths.includes("POST /internal/v1/ecommerce/communications/resend"))
  assert.ok(routePaths.includes("POST /internal/v1/ecommerce/payments/reconcile"))
  assert.ok(routePaths.includes("POST /internal/v1/ecommerce/payments/refund-request"))
  assert.ok(routePaths.includes("GET /internal/v1/ecommerce/payments/report"))
})

test("authenticated core runtime settings routes read and save env-backed settings", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-runtime-settings-"))
  const previousAppName = process.env.APP_NAME
  const previousAppHttpPort = process.env.APP_HTTP_PORT
  const previousDbDriver = process.env.DB_DRIVER
  const previousSqliteFile = process.env.SQLITE_FILE

  try {
    delete process.env.APP_NAME
    delete process.env.APP_HTTP_PORT
    delete process.env.DB_DRIVER
    delete process.env.SQLITE_FILE

    writeFileSync(
      path.join(tempRoot, ".env"),
      ["DB_DRIVER=sqlite", "SQLITE_FILE=storage/runtime.sqlite", "APP_NAME=codexsun"].join("\n"),
      "utf8"
    )

    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const appSuite = createAppSuite()
      const routes = createInternalApiRoutes(appSuite)
      const authService = createAuthService(runtime.primary, config)
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
      const headers = {
        authorization: `Bearer ${adminLogin.accessToken}`,
      }

      const readRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" && candidate.path === "/internal/v1/cxapp/runtime-settings"
      )
      const saveRoute = routes.find(
        (candidate) =>
          candidate.method === "POST" && candidate.path === "/internal/v1/cxapp/runtime-settings"
      )

      assert.ok(readRoute)
      assert.ok(saveRoute)

      const readResponse = await readRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/cxapp/runtime-settings",
          url: new URL("http://localhost/internal/v1/cxapp/runtime-settings"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: readRoute.auth,
          path: readRoute.path,
          surface: readRoute.surface,
          version: readRoute.version,
        },
      })

      const readPayload = JSON.parse(readResponse.body) as {
        envFilePath: string
        values: Record<string, string | boolean>
      }

      assert.equal(readResponse.statusCode, 200)
      assert.equal(readPayload.values.APP_NAME, "codexsun")

      const saveResponse = await saveRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/cxapp/runtime-settings",
          url: new URL("http://localhost/internal/v1/cxapp/runtime-settings"),
          headers,
          bodyText: JSON.stringify({
            restart: false,
            values: {
              ...readPayload.values,
              APP_NAME: "codexsun-updated",
              APP_HTTP_PORT: "3200",
              DB_DRIVER: "sqlite",
              SQLITE_FILE: "storage/runtime.sqlite",
            },
          }),
          jsonBody: {
            restart: false,
            values: {
              ...readPayload.values,
              APP_NAME: "codexsun-updated",
              APP_HTTP_PORT: "3200",
              DB_DRIVER: "sqlite",
              SQLITE_FILE: "storage/runtime.sqlite",
            },
          },
        },
        route: {
          auth: saveRoute.auth,
          path: saveRoute.path,
          surface: saveRoute.surface,
          version: saveRoute.version,
        },
      })

      const savePayload = JSON.parse(saveResponse.body) as {
        saved: boolean
        restartScheduled: boolean
        snapshot: {
          values: Record<string, string | boolean>
        }
      }

      const activityLogRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" && candidate.path === "/internal/v1/framework/activity-log"
      )

      assert.equal(saveResponse.statusCode, 200)
      assert.equal(savePayload.saved, true)
      assert.equal(savePayload.restartScheduled, false)
      assert.equal(savePayload.snapshot.values.APP_NAME, "codexsun-updated")
      assert.match(readFileSync(path.join(tempRoot, ".env"), "utf8"), /APP_NAME=codexsun-updated/)
      assert.ok(activityLogRoute)

      const activityLogResponse = await activityLogRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/framework/activity-log",
          url: new URL("http://localhost/internal/v1/framework/activity-log?category=settings"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: activityLogRoute.auth,
          path: activityLogRoute.path,
          surface: activityLogRoute.surface,
          version: activityLogRoute.version,
        },
      })

      const activityLogPayload = JSON.parse(activityLogResponse.body) as {
        items: Array<{
          category: string
          action: string
          actorEmail: string | null
        }>
      }

      assert.equal(activityLogResponse.statusCode, 200)
      assert.ok(
        activityLogPayload.items.some(
          (item) =>
            item.category === "settings" &&
            item.action === "runtime-settings.save" &&
            item.actorEmail === "sundar@sundar.com"
        )
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    if (previousAppName === undefined) {
      delete process.env.APP_NAME
    } else {
      process.env.APP_NAME = previousAppName
    }
    if (previousAppHttpPort === undefined) {
      delete process.env.APP_HTTP_PORT
    } else {
      process.env.APP_HTTP_PORT = previousAppHttpPort
    }
    if (previousDbDriver === undefined) {
      delete process.env.DB_DRIVER
    } else {
      process.env.DB_DRIVER = previousDbDriver
    }
    if (previousSqliteFile === undefined) {
      delete process.env.SQLITE_FILE
    } else {
      process.env.SQLITE_FILE = previousSqliteFile
    }
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("authenticated framework activity log routes write and list validation events", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-framework-activity-log-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const appSuite = createAppSuite()
      const routes = createInternalApiRoutes(appSuite)
      const authService = createAuthService(runtime.primary, config)
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
      const headers = {
        authorization: `Bearer ${adminLogin.accessToken}`,
      }

      const writeRoute = routes.find(
        (candidate) =>
          candidate.method === "POST" &&
          candidate.path === "/internal/v1/framework/activity-log/test"
      )
      const listRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" &&
          candidate.path === "/internal/v1/framework/activity-log"
      )

      assert.ok(writeRoute)
      assert.ok(listRoute)

      const writeResponse = await writeRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/framework/activity-log/test",
          url: new URL("http://localhost/internal/v1/framework/activity-log/test"),
          headers,
          bodyText: JSON.stringify({}),
          jsonBody: {},
        },
        route: {
          auth: writeRoute.auth,
          path: writeRoute.path,
          surface: writeRoute.surface,
          version: writeRoute.version,
        },
      })

      const writePayload = JSON.parse(writeResponse.body) as {
        item: {
          category: string
          action: string
          actorEmail: string | null
          routePath: string | null
        }
      }

      assert.equal(writeResponse.statusCode, 201)
      assert.equal(writePayload.item.category, "validation")
      assert.equal(writePayload.item.action, "activity-log.test")
      assert.equal(writePayload.item.actorEmail, "sundar@sundar.com")
      assert.equal(writePayload.item.routePath, "/internal/v1/framework/activity-log/test")

      const listResponse = await listRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/framework/activity-log",
          url: new URL("http://localhost/internal/v1/framework/activity-log?category=validation&limit=10"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: listRoute.auth,
          path: listRoute.path,
          surface: listRoute.surface,
          version: listRoute.version,
        },
      })

      const listPayload = JSON.parse(listResponse.body) as {
        items: Array<{
          category: string
          action: string
          message: string
        }>
      }

      assert.equal(listResponse.statusCode, 200)
      assert.ok(
        listPayload.items.some(
          (item) =>
            item.category === "validation" &&
            item.action === "activity-log.test" &&
            item.message ===
              "A test activity log entry was created from the admin workspace."
        )
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("authenticated framework alerts dashboard route returns monitoring summaries", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-framework-alerts-dashboard-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.observability.thresholds.checkoutFailures = 1

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const appSuite = createAppSuite()
      const routes = createInternalApiRoutes(appSuite)
      const authService = createAuthService(runtime.primary, config)
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
      const headers = {
        authorization: `Bearer ${adminLogin.accessToken}`,
      }

      await recordMonitoringEvent(runtime.primary, {
        sourceApp: "ecommerce",
        operation: "checkout",
        status: "failure",
        message: "Checkout failed for alerts route coverage.",
      })

      const dashboardRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" &&
          candidate.path === "/internal/v1/framework/alerts-dashboard"
      )

      assert.ok(dashboardRoute)

      const dashboardResponse = await dashboardRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/framework/alerts-dashboard",
          url: new URL("http://localhost/internal/v1/framework/alerts-dashboard?windowHours=24"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: dashboardRoute.auth,
          path: dashboardRoute.path,
          surface: dashboardRoute.surface,
          version: dashboardRoute.version,
        },
      })

      const dashboardPayload = JSON.parse(dashboardResponse.body) as {
        summaries: Array<{
          operation: string
          failureCount: number
          alertState: string
        }>
      }

      const checkoutSummary = dashboardPayload.summaries.find(
        (item) => item.operation === "checkout"
      )

      assert.equal(dashboardResponse.statusCode, 200)
      assert.equal(checkoutSummary?.failureCount, 1)
      assert.equal(checkoutSummary?.alertState, "breached")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("authenticated framework backup and security review routes return operational data", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-framework-ops-routes-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.operations.backups.enabled = true
    config.operations.backups.googleDrive.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const appSuite = createAppSuite()
      const routes = createInternalApiRoutes(appSuite)
      const authService = createAuthService(runtime.primary, config)
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
      const headers = {
        authorization: `Bearer ${adminLogin.accessToken}`,
      }

      const runBackupRoute = routes.find(
        (candidate) =>
          candidate.method === "POST" &&
          candidate.path === "/internal/v1/framework/database-backups/run"
      )
      const listBackupRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" &&
          candidate.path === "/internal/v1/framework/database-backups"
      )
      const updateItemRoute = routes.find(
        (candidate) =>
          candidate.method === "POST" &&
          candidate.path === "/internal/v1/framework/security-review/item"
      )
      const completeReviewRoute = routes.find(
        (candidate) =>
          candidate.method === "POST" &&
          candidate.path === "/internal/v1/framework/security-review/complete"
      )
      const readReviewRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" &&
          candidate.path === "/internal/v1/framework/security-review"
      )

      assert.ok(runBackupRoute)
      assert.ok(listBackupRoute)
      assert.ok(updateItemRoute)
      assert.ok(completeReviewRoute)
      assert.ok(readReviewRoute)

      const runBackupResponse = await runBackupRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/framework/database-backups/run",
          url: new URL("http://localhost/internal/v1/framework/database-backups/run"),
          headers,
          bodyText: JSON.stringify({}),
          jsonBody: {},
        },
        route: {
          auth: runBackupRoute.auth,
          path: runBackupRoute.path,
          surface: runBackupRoute.surface,
          version: runBackupRoute.version,
        },
      })

      const runBackupPayload = JSON.parse(runBackupResponse.body) as {
        item: { id: string; status: string }
      }

      assert.equal(runBackupResponse.statusCode, 201)
      assert.equal(runBackupPayload.item.status, "completed")

      const listBackupResponse = await listBackupRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/framework/database-backups",
          url: new URL("http://localhost/internal/v1/framework/database-backups"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: listBackupRoute.auth,
          path: listBackupRoute.path,
          surface: listBackupRoute.surface,
          version: listBackupRoute.version,
        },
      })

      const listBackupPayload = JSON.parse(listBackupResponse.body) as {
        backups: Array<{ id: string }>
      }

      assert.equal(listBackupResponse.statusCode, 200)
      assert.equal(listBackupPayload.backups.length >= 1, true)

      const readReviewResponse = await readReviewRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/framework/security-review",
          url: new URL("http://localhost/internal/v1/framework/security-review"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: readReviewRoute.auth,
          path: readReviewRoute.path,
          surface: readReviewRoute.surface,
          version: readReviewRoute.version,
        },
      })

      const readReviewPayload = JSON.parse(readReviewResponse.body) as {
        items: Array<{ id: string; status: string }>
      }

      assert.equal(readReviewResponse.statusCode, 200)
      assert.equal(readReviewPayload.items.length >= 1, true)

      const firstItem = readReviewPayload.items[0]
      assert.ok(firstItem)

      const updateItemResponse = await updateItemRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/framework/security-review/item",
          url: new URL(
            `http://localhost/internal/v1/framework/security-review/item?id=${encodeURIComponent(firstItem.id)}`
          ),
          headers,
          bodyText: JSON.stringify({
            status: "passed",
            evidence: "Route test validation.",
            notes: "No issue.",
            reviewedBy: "security.owner@codexsun.local",
          }),
          jsonBody: {
            status: "passed",
            evidence: "Route test validation.",
            notes: "No issue.",
            reviewedBy: "security.owner@codexsun.local",
          },
        },
        route: {
          auth: updateItemRoute.auth,
          path: updateItemRoute.path,
          surface: updateItemRoute.surface,
          version: updateItemRoute.version,
        },
      })

      const updateItemPayload = JSON.parse(updateItemResponse.body) as {
        item: { status: string }
      }

      assert.equal(updateItemResponse.statusCode, 200)
      assert.equal(updateItemPayload.item.status, "passed")

      const completeReviewResponse = await completeReviewRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/framework/security-review/complete",
          url: new URL("http://localhost/internal/v1/framework/security-review/complete"),
          headers,
          bodyText: JSON.stringify({
            reviewedBy: "security.owner@codexsun.local",
            summary: "Route test security review checkpoint.",
          }),
          jsonBody: {
            reviewedBy: "security.owner@codexsun.local",
            summary: "Route test security review checkpoint.",
          },
        },
        route: {
          auth: completeReviewRoute.auth,
          path: completeReviewRoute.path,
          surface: completeReviewRoute.surface,
          version: completeReviewRoute.version,
        },
      })

      const completeReviewPayload = JSON.parse(completeReviewResponse.body) as {
        run: { overallStatus: string; summary: string }
      }

      assert.equal(completeReviewResponse.statusCode, 201)
      assert.equal(completeReviewPayload.run.overallStatus, "healthy")
      assert.equal(completeReviewPayload.run.summary, "Route test security review checkpoint.")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("authenticated core auth routes manage roles, permissions, and users", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-auth-routes-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const appSuite = createAppSuite()
      const routes = createInternalApiRoutes(appSuite)
      const authService = createAuthService(runtime.primary, config)
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
      const headers = {
        authorization: `Bearer ${adminLogin.accessToken}`,
      }

      const listRolesRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/cxapp/auth/roles"
      )
      const listPermissionsRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/cxapp/auth/permissions"
      )
      const readPermissionRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/cxapp/auth/permission"
      )
      const createPermissionRoute = routes.find(
        (candidate) => candidate.method === "POST" && candidate.path === "/internal/v1/cxapp/auth/permissions"
      )
      const updatePermissionRoute = routes.find(
        (candidate) => candidate.method === "PATCH" && candidate.path === "/internal/v1/cxapp/auth/permission"
      )
      const createRoleRoute = routes.find(
        (candidate) => candidate.method === "POST" && candidate.path === "/internal/v1/cxapp/auth/roles"
      )
      const readRoleRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/cxapp/auth/role"
      )
      const updateRoleRoute = routes.find(
        (candidate) => candidate.method === "PATCH" && candidate.path === "/internal/v1/cxapp/auth/role"
      )
      const createUserRoute = routes.find(
        (candidate) => candidate.method === "POST" && candidate.path === "/internal/v1/cxapp/auth/users"
      )
      const readUserRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/cxapp/auth/user"
      )
      const updateUserRoute = routes.find(
        (candidate) => candidate.method === "PATCH" && candidate.path === "/internal/v1/cxapp/auth/user"
      )

      assert.ok(listRolesRoute)
      assert.ok(listPermissionsRoute)
      assert.ok(readPermissionRoute)
      assert.ok(createPermissionRoute)
      assert.ok(updatePermissionRoute)
      assert.ok(createRoleRoute)
      assert.ok(readRoleRoute)
      assert.ok(updateRoleRoute)
      assert.ok(createUserRoute)
      assert.ok(readUserRoute)
      assert.ok(updateUserRoute)

      const rolesResponse = await listRolesRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/cxapp/auth/roles",
          url: new URL("http://localhost/internal/v1/cxapp/auth/roles"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: listRolesRoute.auth,
          path: listRolesRoute.path,
          surface: listRolesRoute.surface,
          version: listRolesRoute.version,
        },
      })

      const rolesPayload = JSON.parse(rolesResponse.body) as {
        items: Array<{ key: string; assignedUserCount: number }>
      }

      assert.equal(rolesResponse.statusCode, 200)
      assert.ok(rolesPayload.items.some((item) => item.key === "staff_operator"))

      const permissionsResponse = await listPermissionsRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/cxapp/auth/permissions",
          url: new URL("http://localhost/internal/v1/cxapp/auth/permissions"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: listPermissionsRoute.auth,
          path: listPermissionsRoute.path,
          surface: listPermissionsRoute.surface,
          version: listPermissionsRoute.version,
        },
      })

      const permissionsPayload = JSON.parse(permissionsResponse.body) as {
        items: Array<{ key: string }>
      }

      assert.equal(permissionsResponse.statusCode, 200)
      assert.ok(permissionsPayload.items.some((item) => item.key === "users:manage"))

      const createPermissionResponse = await createPermissionRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/cxapp/auth/permissions",
          url: new URL("http://localhost/internal/v1/cxapp/auth/permissions"),
          headers,
          bodyText: JSON.stringify({
            key: "billing:profit_and_loss:view",
            name: "Profit And Loss View",
            summary: "View the billing profit and loss report.",
            scopeType: "report",
            appId: "billing",
            resourceKey: "profit-and-loss",
            actionKey: "view",
            route: "/dashboard/billing/profit-and-loss",
            isActive: true,
          }),
          jsonBody: {
            key: "billing:profit_and_loss:view",
            name: "Profit And Loss View",
            summary: "View the billing profit and loss report.",
            scopeType: "report",
            appId: "billing",
            resourceKey: "profit-and-loss",
            actionKey: "view",
            route: "/dashboard/billing/profit-and-loss",
            isActive: true,
          },
        },
        route: {
          auth: createPermissionRoute.auth,
          path: createPermissionRoute.path,
          surface: createPermissionRoute.surface,
          version: createPermissionRoute.version,
        },
      })

      const createdPermissionPayload = JSON.parse(createPermissionResponse.body) as {
        item: { key: string; scopeType: string; appId: string | null }
      }

      assert.equal(createPermissionResponse.statusCode, 201)
      assert.equal(createdPermissionPayload.item.key, "billing:profit_and_loss:view")
      assert.equal(createdPermissionPayload.item.scopeType, "report")
      assert.equal(createdPermissionPayload.item.appId, "billing")

      const readPermissionResponse = await readPermissionRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/cxapp/auth/permission",
          url: new URL("http://localhost/internal/v1/cxapp/auth/permission?id=billing%3Aprofit_and_loss%3Aview"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: readPermissionRoute.auth,
          path: readPermissionRoute.path,
          surface: readPermissionRoute.surface,
          version: readPermissionRoute.version,
        },
      })

      const readPermissionPayload = JSON.parse(readPermissionResponse.body) as {
        item: { resourceKey: string; route: string | null }
      }

      assert.equal(readPermissionResponse.statusCode, 200)
      assert.equal(readPermissionPayload.item.resourceKey, "profit-and-loss")
      assert.equal(readPermissionPayload.item.route, "/dashboard/billing/profit-and-loss")

      const updatePermissionResponse = await updatePermissionRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "PATCH",
          pathname: "/internal/v1/cxapp/auth/permission",
          url: new URL("http://localhost/internal/v1/cxapp/auth/permission?id=billing%3Aprofit_and_loss%3Aview"),
          headers,
          bodyText: JSON.stringify({
            key: "billing:profit_and_loss:view",
            name: "Profit And Loss Report",
            summary: "Updated report permission.",
            scopeType: "report",
            appId: "billing",
            resourceKey: "profit-and-loss",
            actionKey: "view",
            route: "/dashboard/billing/profit-and-loss",
            isActive: false,
          }),
          jsonBody: {
            key: "billing:profit_and_loss:view",
            name: "Profit And Loss Report",
            summary: "Updated report permission.",
            scopeType: "report",
            appId: "billing",
            resourceKey: "profit-and-loss",
            actionKey: "view",
            route: "/dashboard/billing/profit-and-loss",
            isActive: false,
          },
        },
        route: {
          auth: updatePermissionRoute.auth,
          path: updatePermissionRoute.path,
          surface: updatePermissionRoute.surface,
          version: updatePermissionRoute.version,
        },
      })

      const updatedPermissionPayload = JSON.parse(updatePermissionResponse.body) as {
        item: { name: string; isActive: boolean }
      }

      assert.equal(updatePermissionResponse.statusCode, 200)
      assert.equal(updatedPermissionPayload.item.name, "Profit And Loss Report")
      assert.equal(updatedPermissionPayload.item.isActive, false)

      const createRoleResponse = await createRoleRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/cxapp/auth/roles",
          url: new URL("http://localhost/internal/v1/cxapp/auth/roles"),
          headers,
          bodyText: JSON.stringify({
            actorType: "staff",
            key: "catalog_manager",
            name: "Catalog Manager",
            summary: "Manage product catalog users.",
            permissionKeys: ["dashboard:view", "users:manage"],
            isActive: true,
          }),
          jsonBody: {
            actorType: "staff",
            key: "catalog_manager",
            name: "Catalog Manager",
            summary: "Manage product catalog users.",
            permissionKeys: ["dashboard:view", "users:manage"],
            isActive: true,
          },
        },
        route: {
          auth: createRoleRoute.auth,
          path: createRoleRoute.path,
          surface: createRoleRoute.surface,
          version: createRoleRoute.version,
        },
      })

      const createdRolePayload = JSON.parse(createRoleResponse.body) as {
        item: { key: string; permissionKeys?: string[]; permissions: Array<{ key: string }> }
      }

      assert.equal(createRoleResponse.statusCode, 201)
      assert.equal(createdRolePayload.item.key, "catalog_manager")
      assert.deepEqual(
        createdRolePayload.item.permissions.map((permission) => permission.key),
        ["dashboard:view", "users:manage"]
      )

      const readRoleResponse = await readRoleRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/cxapp/auth/role",
          url: new URL("http://localhost/internal/v1/cxapp/auth/role?id=catalog_manager"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: readRoleRoute.auth,
          path: readRoleRoute.path,
          surface: readRoleRoute.surface,
          version: readRoleRoute.version,
        },
      })

      const readRolePayload = JSON.parse(readRoleResponse.body) as {
        item: { name: string; actorType: string }
      }

      assert.equal(readRoleResponse.statusCode, 200)
      assert.equal(readRolePayload.item.name, "Catalog Manager")
      assert.equal(readRolePayload.item.actorType, "staff")

      const updateRoleResponse = await updateRoleRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "PATCH",
          pathname: "/internal/v1/cxapp/auth/role",
          url: new URL("http://localhost/internal/v1/cxapp/auth/role?id=catalog_manager"),
          headers,
          bodyText: JSON.stringify({
            actorType: "staff",
            key: "catalog_manager",
            name: "Catalog Operator",
            summary: "Updated role summary.",
            permissionKeys: ["dashboard:view"],
            isActive: false,
          }),
          jsonBody: {
            actorType: "staff",
            key: "catalog_manager",
            name: "Catalog Operator",
            summary: "Updated role summary.",
            permissionKeys: ["dashboard:view"],
            isActive: false,
          },
        },
        route: {
          auth: updateRoleRoute.auth,
          path: updateRoleRoute.path,
          surface: updateRoleRoute.surface,
          version: updateRoleRoute.version,
        },
      })

      const updatedRolePayload = JSON.parse(updateRoleResponse.body) as {
        item: { name: string; isActive: boolean; permissions: Array<{ key: string }> }
      }

      assert.equal(updateRoleResponse.statusCode, 200)
      assert.equal(updatedRolePayload.item.name, "Catalog Operator")
      assert.equal(updatedRolePayload.item.isActive, false)
      assert.deepEqual(
        updatedRolePayload.item.permissions.map((permission) => permission.key),
        ["dashboard:view"]
      )

      const createUserResponse = await createUserRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/cxapp/auth/users",
          url: new URL("http://localhost/internal/v1/cxapp/auth/users"),
          headers,
          bodyText: JSON.stringify({
            email: "user-admin-route@codexsun.local",
            phoneNumber: "+919999999991",
            displayName: "Route User",
            actorType: "staff",
            avatarUrl: null,
            organizationName: "codexsun",
            roleKeys: ["staff_operator"],
            password: "RouteUser@123",
            isActive: true,
            isSuperAdmin: false,
          }),
          jsonBody: {
            email: "user-admin-route@codexsun.local",
            phoneNumber: "+919999999991",
            displayName: "Route User",
            actorType: "staff",
            avatarUrl: null,
            organizationName: "codexsun",
            roleKeys: ["staff_operator"],
            password: "RouteUser@123",
            isActive: true,
            isSuperAdmin: false,
          },
        },
        route: {
          auth: createUserRoute.auth,
          path: createUserRoute.path,
          surface: createUserRoute.surface,
          version: createUserRoute.version,
        },
      })

      const createdUserPayload = JSON.parse(createUserResponse.body) as {
        item: { id: string; displayName: string; roles: Array<{ key: string }> }
      }

      assert.equal(createUserResponse.statusCode, 201)
      assert.equal(createdUserPayload.item.displayName, "Route User")
      assert.deepEqual(createdUserPayload.item.roles.map((role) => role.key), ["staff_operator"])

      const readUserResponse = await readUserRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/cxapp/auth/user",
          url: new URL(
            `http://localhost/internal/v1/cxapp/auth/user?id=${encodeURIComponent(createdUserPayload.item.id)}`
          ),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: readUserRoute.auth,
          path: readUserRoute.path,
          surface: readUserRoute.surface,
          version: readUserRoute.version,
        },
      })

      const readUserPayload = JSON.parse(readUserResponse.body) as {
        item: { email: string; displayName: string }
      }

      assert.equal(readUserResponse.statusCode, 200)
      assert.equal(readUserPayload.item.email, "user-admin-route@codexsun.local")

      const updateUserResponse = await updateUserRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "PATCH",
          pathname: "/internal/v1/cxapp/auth/user",
          url: new URL(
            `http://localhost/internal/v1/cxapp/auth/user?id=${encodeURIComponent(createdUserPayload.item.id)}`
          ),
          headers,
          bodyText: JSON.stringify({
            email: "user-admin-route@codexsun.local",
            phoneNumber: "+919999999991",
            displayName: "Route User Updated",
            actorType: "staff",
            avatarUrl: null,
            organizationName: "codexsun",
            roleKeys: ["staff_operator"],
            password: null,
            isActive: false,
            isSuperAdmin: false,
          }),
          jsonBody: {
            email: "user-admin-route@codexsun.local",
            phoneNumber: "+919999999991",
            displayName: "Route User Updated",
            actorType: "staff",
            avatarUrl: null,
            organizationName: "codexsun",
            roleKeys: ["staff_operator"],
            password: null,
            isActive: false,
            isSuperAdmin: false,
          },
        },
        route: {
          auth: updateUserRoute.auth,
          path: updateUserRoute.path,
          surface: updateUserRoute.surface,
          version: updateUserRoute.version,
        },
      })

      const updatedUserPayload = JSON.parse(updateUserResponse.body) as {
        item: { displayName: string; isActive: boolean }
      }

      assert.equal(updateUserResponse.statusCode, 200)
      assert.equal(updatedUserPayload.item.displayName, "Route User Updated")
      assert.equal(updatedUserPayload.item.isActive, false)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("authenticated core common-module routes list and mutate shared master records", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-common-module-routes-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const appSuite = createAppSuite()
      const routes = createInternalApiRoutes(appSuite)
      const authService = createAuthService(runtime.primary, config)
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
      const headers = {
        authorization: `Bearer ${adminLogin.accessToken}`,
      }

      const listRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" && candidate.path === "/internal/v1/core/common-modules/items"
      )
      const createRoute = routes.find(
        (candidate) =>
          candidate.method === "POST" && candidate.path === "/internal/v1/core/common-modules/items"
      )
      const readRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" && candidate.path === "/internal/v1/core/common-modules/item"
      )
      const updateRoute = routes.find(
        (candidate) =>
          candidate.method === "PATCH" && candidate.path === "/internal/v1/core/common-modules/item"
      )
      const deleteRoute = routes.find(
        (candidate) =>
          candidate.method === "DELETE" && candidate.path === "/internal/v1/core/common-modules/item"
      )

      assert.ok(listRoute)
      assert.ok(createRoute)
      assert.ok(readRoute)
      assert.ok(updateRoute)
      assert.ok(deleteRoute)

      const listResponse = await listRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/core/common-modules/items",
          url: new URL("http://localhost/internal/v1/core/common-modules/items?module=countries"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: listRoute.auth,
          path: listRoute.path,
          surface: listRoute.surface,
          version: listRoute.version,
        },
      })

      const listedPayload = JSON.parse(listResponse.body) as {
        module: string
        items: Array<{ id: string; name: string }>
      }

      assert.equal(listResponse.statusCode, 200)
      assert.equal(listedPayload.module, "countries")
      assert.ok(listedPayload.items.some((item) => item.name === "India"))

      const createResponse = await createRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/core/common-modules/items",
          url: new URL("http://localhost/internal/v1/core/common-modules/items?module=countries"),
          headers,
          bodyText: JSON.stringify({
            code: "SG",
            name: "Singapore",
            phone_code: "+65",
            isActive: true,
          }),
          jsonBody: {
            code: "SG",
            name: "Singapore",
            phone_code: "+65",
            isActive: true,
          },
        },
        route: {
          auth: createRoute.auth,
          path: createRoute.path,
          surface: createRoute.surface,
          version: createRoute.version,
        },
      })

      const createdPayload = JSON.parse(createResponse.body) as {
        item: { id: string; code: string; name: string }
      }

      assert.equal(createResponse.statusCode, 201)
      assert.equal(createdPayload.item.name, "Singapore")

      const readResponse = await readRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/core/common-modules/item",
          url: new URL(
            `http://localhost/internal/v1/core/common-modules/item?module=countries&id=${encodeURIComponent(createdPayload.item.id)}`
          ),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: readRoute.auth,
          path: readRoute.path,
          surface: readRoute.surface,
          version: readRoute.version,
        },
      })

      const readPayload = JSON.parse(readResponse.body) as {
        item: { code: string; name: string }
      }

      assert.equal(readResponse.statusCode, 200)
      assert.equal(readPayload.item.code, "SG")

      const updateResponse = await updateRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "PATCH",
          pathname: "/internal/v1/core/common-modules/item",
          url: new URL(
            `http://localhost/internal/v1/core/common-modules/item?module=countries&id=${encodeURIComponent(createdPayload.item.id)}`
          ),
          headers,
          bodyText: JSON.stringify({
            code: "SG",
            name: "Singapore HQ",
            phone_code: "+65",
            isActive: false,
          }),
          jsonBody: {
            code: "SG",
            name: "Singapore HQ",
            phone_code: "+65",
            isActive: false,
          },
        },
        route: {
          auth: updateRoute.auth,
          path: updateRoute.path,
          surface: updateRoute.surface,
          version: updateRoute.version,
        },
      })

      const updatedPayload = JSON.parse(updateResponse.body) as {
        item: { isActive: boolean; name: string }
      }

      assert.equal(updateResponse.statusCode, 200)
      assert.equal(updatedPayload.item.name, "Singapore HQ")
      assert.equal(updatedPayload.item.isActive, false)

      const deleteResponse = await deleteRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "DELETE",
          pathname: "/internal/v1/core/common-modules/item",
          url: new URL(
            `http://localhost/internal/v1/core/common-modules/item?module=countries&id=${encodeURIComponent(createdPayload.item.id)}`
          ),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: deleteRoute.auth,
          path: deleteRoute.path,
          surface: deleteRoute.surface,
          version: deleteRoute.version,
        },
      })

      const deletePayload = JSON.parse(deleteResponse.body) as {
        deleted: boolean
        id: string
      }

      assert.equal(deleteResponse.statusCode, 200)
      assert.equal(deletePayload.deleted, true)
      assert.equal(deletePayload.id, createdPayload.item.id)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("authenticated core common-module delete route blocks referenced records", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-common-module-delete-guard-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const appSuite = createAppSuite()
      const routes = createInternalApiRoutes(appSuite)
      const authService = createAuthService(runtime.primary, config)
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
      const headers = {
        authorization: `Bearer ${adminLogin.accessToken}`,
      }

      const createRoute = routes.find(
        (candidate) =>
          candidate.method === "POST" && candidate.path === "/internal/v1/core/common-modules/items"
      )
      const deleteRoute = routes.find(
        (candidate) =>
          candidate.method === "DELETE" && candidate.path === "/internal/v1/core/common-modules/item"
      )

      assert.ok(createRoute)
      assert.ok(deleteRoute)

      const createCountryResponse = await createRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/core/common-modules/items",
          url: new URL("http://localhost/internal/v1/core/common-modules/items?module=countries"),
          headers,
          bodyText: JSON.stringify({
            code: "SG",
            name: "Singapore",
            phone_code: "+65",
            isActive: true,
          }),
          jsonBody: {
            code: "SG",
            name: "Singapore",
            phone_code: "+65",
            isActive: true,
          },
        },
        route: {
          auth: createRoute.auth,
          path: createRoute.path,
          surface: createRoute.surface,
          version: createRoute.version,
        },
      })

      const createdCountryPayload = JSON.parse(createCountryResponse.body) as {
        item: { id: string }
      }

      await createRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/core/common-modules/items",
          url: new URL("http://localhost/internal/v1/core/common-modules/items?module=states"),
          headers,
          bodyText: JSON.stringify({
            country_id: createdCountryPayload.item.id,
            code: "SG-01",
            name: "Central",
            isActive: true,
          }),
          jsonBody: {
            country_id: createdCountryPayload.item.id,
            code: "SG-01",
            name: "Central",
            isActive: true,
          },
        },
        route: {
          auth: createRoute.auth,
          path: createRoute.path,
          surface: createRoute.surface,
          version: createRoute.version,
        },
      })

      await assert.rejects(
        () =>
          deleteRoute.handler({
            appSuite,
            config,
            databases: runtime,
            request: {
              method: "DELETE",
              pathname: "/internal/v1/core/common-modules/item",
              url: new URL(
                `http://localhost/internal/v1/core/common-modules/item?module=countries&id=${encodeURIComponent(createdCountryPayload.item.id)}`
              ),
              headers,
              bodyText: null,
              jsonBody: null,
            },
            route: {
              auth: deleteRoute.auth,
              path: deleteRoute.path,
              surface: deleteRoute.surface,
              version: deleteRoute.version,
            },
          }),
        (error: unknown) => {
          assert.ok(error instanceof Error)
          assert.match(error.message, /referenced by States/i)
          return true
        }
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("authenticated billing internal routes return categories, vouchers, reports, and accept voucher posting", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-routes-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const appSuite = createAppSuite()
      const routes = createInternalApiRoutes(appSuite)
      const authService = createAuthService(runtime.primary, config)
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
      const headers = {
        authorization: `Bearer ${adminLogin.accessToken}`,
      }

      const listRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/billing/vouchers"
      )
      const categoryListRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/billing/categories"
      )
      const categoryCreateRoute = routes.find(
        (candidate) => candidate.method === "POST" && candidate.path === "/internal/v1/billing/categories"
      )
      const categoryReadRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/billing/category"
      )
      const categoryUpdateRoute = routes.find(
        (candidate) => candidate.method === "PATCH" && candidate.path === "/internal/v1/billing/category"
      )
      const categoryDeleteRoute = routes.find(
        (candidate) => candidate.method === "DELETE" && candidate.path === "/internal/v1/billing/category"
      )
      const categoryRestoreRoute = routes.find(
        (candidate) => candidate.method === "POST" && candidate.path === "/internal/v1/billing/category/restore"
      )
      const reportsRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/billing/reports"
      )
      const createRoute = routes.find(
        (candidate) => candidate.method === "POST" && candidate.path === "/internal/v1/billing/vouchers"
      )

      assert.ok(categoryListRoute)
      assert.ok(categoryCreateRoute)
      assert.ok(categoryReadRoute)
      assert.ok(categoryUpdateRoute)
      assert.ok(categoryDeleteRoute)
      assert.ok(categoryRestoreRoute)
      assert.ok(listRoute)
      assert.ok(reportsRoute)
      assert.ok(createRoute)

      const categoryListResponse = await categoryListRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/billing/categories",
          url: new URL("http://localhost/internal/v1/billing/categories"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: categoryListRoute.auth,
          path: categoryListRoute.path,
          surface: categoryListRoute.surface,
          version: categoryListRoute.version,
        },
      })

      const categoryListPayload = JSON.parse(categoryListResponse.body) as {
        items: Array<{ id: string; name: string }>
      }

      assert.equal(categoryListResponse.statusCode, 200)
      assert.ok(categoryListPayload.items.length >= 1)
      const assetsCategory = categoryListPayload.items.find((item) => item.name === "Assets")

      assert.ok(assetsCategory)

      const categoryCreateResponse = await categoryCreateRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/billing/categories",
          url: new URL("http://localhost/internal/v1/billing/categories"),
          headers,
          bodyText: JSON.stringify({
            name: "Custom Bucket",
            description: "Temporary category for route coverage.",
          }),
          jsonBody: {
            name: "Custom Bucket",
            description: "Temporary category for route coverage.",
          },
        },
        route: {
          auth: categoryCreateRoute.auth,
          path: categoryCreateRoute.path,
          surface: categoryCreateRoute.surface,
          version: categoryCreateRoute.version,
        },
      })

      const categoryCreatedPayload = JSON.parse(categoryCreateResponse.body) as {
        item: { id: string; name: string; nature: string | null }
      }

      assert.equal(categoryCreateResponse.statusCode, 201)
      assert.equal(categoryCreatedPayload.item.name, "Custom Bucket")
      assert.equal(categoryCreatedPayload.item.nature, null)

      const categoryReadResponse = await categoryReadRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/billing/category",
          url: new URL(
            `http://localhost/internal/v1/billing/category?id=${encodeURIComponent(assetsCategory.id)}`
          ),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: categoryReadRoute.auth,
          path: categoryReadRoute.path,
          surface: categoryReadRoute.surface,
          version: categoryReadRoute.version,
        },
      })

      const categoryReadPayload = JSON.parse(categoryReadResponse.body) as {
        item: { id: string; description: string; name: string }
      }

      assert.equal(categoryReadResponse.statusCode, 200)
      assert.equal(categoryReadPayload.item.id, assetsCategory.id)
      assert.equal(categoryReadPayload.item.name, "Assets")

      const categoryUpdateResponse = await categoryUpdateRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "PATCH",
          pathname: "/internal/v1/billing/category",
          url: new URL(
            `http://localhost/internal/v1/billing/category?id=${encodeURIComponent(assetsCategory.id)}`
          ),
          headers,
          bodyText: JSON.stringify({
            name: "Assets",
            description: "Updated category from route coverage.",
          }),
          jsonBody: {
            name: "Assets",
            description: "Updated category from route coverage.",
          },
        },
        route: {
          auth: categoryUpdateRoute.auth,
          path: categoryUpdateRoute.path,
          surface: categoryUpdateRoute.surface,
          version: categoryUpdateRoute.version,
        },
      })

      const categoryUpdatedPayload = JSON.parse(categoryUpdateResponse.body) as {
        item: { description: string; name: string }
      }

      assert.equal(categoryUpdateResponse.statusCode, 200)
      assert.equal(categoryUpdatedPayload.item.name, "Assets")
      assert.equal(
        categoryUpdatedPayload.item.description,
        "Updated category from route coverage."
      )

      const categoryDeleteResponse = await categoryDeleteRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "DELETE",
          pathname: "/internal/v1/billing/category",
          url: new URL(
            `http://localhost/internal/v1/billing/category?id=${encodeURIComponent(assetsCategory.id)}`
          ),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: categoryDeleteRoute.auth,
          path: categoryDeleteRoute.path,
          surface: categoryDeleteRoute.surface,
          version: categoryDeleteRoute.version,
        },
      })

      assert.equal(categoryDeleteResponse.statusCode, 200)

      const categoryRestoreResponse = await categoryRestoreRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/billing/category/restore",
          url: new URL(
            `http://localhost/internal/v1/billing/category/restore?id=${encodeURIComponent(assetsCategory.id)}`
          ),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: categoryRestoreRoute.auth,
          path: categoryRestoreRoute.path,
          surface: categoryRestoreRoute.surface,
          version: categoryRestoreRoute.version,
        },
      })

      const categoryRestoredPayload = JSON.parse(categoryRestoreResponse.body) as {
        item: { deletedAt: string | null }
      }

      assert.equal(categoryRestoreResponse.statusCode, 200)
      assert.equal(categoryRestoredPayload.item.deletedAt, null)

      const listResponse = await listRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/billing/vouchers",
          url: new URL("http://localhost/internal/v1/billing/vouchers"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: listRoute.auth,
          path: listRoute.path,
          surface: listRoute.surface,
          version: listRoute.version,
        },
      })

      const listedPayload = JSON.parse(listResponse.body) as {
        items: Array<{ id: string; voucherNumber: string }>
      }

      assert.equal(listResponse.statusCode, 200)
      assert.ok(listedPayload.items.length >= 1)

      const createResponse = await createRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "POST",
          pathname: "/internal/v1/billing/vouchers",
          url: new URL("http://localhost/internal/v1/billing/vouchers"),
          headers,
          bodyText: JSON.stringify({
            voucherNumber: "",
            type: "journal",
            date: "2026-04-05",
            counterparty: "Route Test",
            narration: "Voucher posted through internal billing route.",
            lines: [
              {
                ledgerId: "ledger-rent",
                side: "debit",
                amount: 7000,
                note: "Expense line.",
              },
              {
                ledgerId: "ledger-sundry-creditors",
                side: "credit",
                amount: 7000,
                note: "Payable line.",
              },
            ],
            billAllocations: [],
            gst: null,
            transport: null,
            generateEInvoice: false,
            generateEWayBill: false,
          }),
          jsonBody: {
            voucherNumber: "",
            type: "journal",
            date: "2026-04-05",
            counterparty: "Route Test",
            narration: "Voucher posted through internal billing route.",
            lines: [
              {
                ledgerId: "ledger-rent",
                side: "debit",
                amount: 7000,
                note: "Expense line.",
              },
              {
                ledgerId: "ledger-sundry-creditors",
                side: "credit",
                amount: 7000,
                note: "Payable line.",
              },
            ],
            billAllocations: [],
            gst: null,
            transport: null,
            generateEInvoice: false,
            generateEWayBill: false,
          },
        },
        route: {
          auth: createRoute.auth,
          path: createRoute.path,
          surface: createRoute.surface,
          version: createRoute.version,
        },
      })

      const createdPayload = JSON.parse(createResponse.body) as {
        item: { voucherNumber: string; financialYear: { code: string } }
      }

      assert.equal(createResponse.statusCode, 201)
      assert.match(createdPayload.item.voucherNumber, /^JRN-2026-27-\d{3}$/)
      assert.equal(createdPayload.item.financialYear.code, "FY2026-27")

      const reportsResponse = await reportsRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/billing/reports",
          url: new URL("http://localhost/internal/v1/billing/reports"),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: reportsRoute.auth,
          path: reportsRoute.path,
          surface: reportsRoute.surface,
          version: reportsRoute.version,
        },
      })

      const reportsPayload = JSON.parse(reportsResponse.body) as {
        item: {
          trialBalance: { items: Array<{ ledgerId: string }> }
          profitAndLoss: { totalExpense: number }
          outstanding: { items: Array<{ voucherNumber: string }> }
        }
      }

      assert.equal(reportsResponse.statusCode, 200)
      assert.ok(reportsPayload.item.trialBalance.items.length >= 1)
      assert.equal(reportsPayload.item.profitAndLoss.totalExpense > 0, true)
      assert.ok(Array.isArray(reportsPayload.item.outstanding.items))
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
