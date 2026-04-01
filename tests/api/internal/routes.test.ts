import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { createInternalApiRoutes } from "../../../apps/api/src/internal/routes.js"
import { createAuthService } from "../../../apps/core/src/services/service-factory.js"
import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"
import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"
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

  assert.ok(routePaths.includes("GET /internal/v1/billing/ledgers"))
  assert.ok(routePaths.includes("GET /internal/v1/billing/ledger"))
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

test("authenticated billing internal routes return vouchers, reports, and accept voucher posting", async () => {
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
      const reportsRoute = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/billing/reports"
      )
      const createRoute = routes.find(
        (candidate) => candidate.method === "POST" && candidate.path === "/internal/v1/billing/vouchers"
      )

      assert.ok(listRoute)
      assert.ok(reportsRoute)
      assert.ok(createRoute)

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
