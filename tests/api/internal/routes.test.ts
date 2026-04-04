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
  assert.ok(routePaths.includes("GET /internal/v1/core/company"))
  assert.ok(routePaths.includes("POST /internal/v1/core/companies"))
  assert.ok(routePaths.includes("PATCH /internal/v1/core/company"))
  assert.ok(routePaths.includes("DELETE /internal/v1/core/company"))
  assert.ok(routePaths.includes("GET /internal/v1/core/products"))
  assert.ok(routePaths.includes("GET /internal/v1/core/product"))
  assert.ok(routePaths.includes("POST /internal/v1/core/products"))
  assert.ok(routePaths.includes("PATCH /internal/v1/core/product"))
  assert.ok(routePaths.includes("DELETE /internal/v1/core/product"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/media"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/media"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/media-item"))
  assert.ok(routePaths.includes("PATCH /internal/v1/framework/media-item"))
  assert.ok(routePaths.includes("DELETE /internal/v1/framework/media-item"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/media-item/restore"))
  assert.ok(routePaths.includes("GET /internal/v1/framework/media-folders"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/media-folders"))
  assert.ok(routePaths.includes("PATCH /internal/v1/framework/media-folder"))
  assert.ok(routePaths.includes("DELETE /internal/v1/framework/media-folder"))
  assert.ok(routePaths.includes("POST /internal/v1/framework/media-folder/restore"))
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
