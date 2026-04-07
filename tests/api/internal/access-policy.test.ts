import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { createInternalApiRoutes } from "../../../apps/api/src/internal/routes.js"
import { createAuthService } from "../../../apps/cxapp/src/services/service-factory.js"
import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"
import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../../apps/framework/src/runtime/database/index.js"

test("internal route access policy blocks requests outside allowed internal api ranges", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-internal-access-policy-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.security.internalApiAllowedIps = ["10.0.0.0/24"]

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
      const route = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/cxapp/runtime-settings"
      )

      assert.ok(route)

      await assert.rejects(
        () =>
          route.handler({
            appSuite,
            config,
            databases: runtime,
            request: {
              method: "GET",
              pathname: "/internal/v1/cxapp/runtime-settings",
              url: new URL("http://localhost/internal/v1/cxapp/runtime-settings"),
              headers: {
                authorization: `Bearer ${adminLogin.accessToken}`,
              },
              remoteAddress: "127.0.0.1",
              bodyText: null,
              jsonBody: null,
            },
            route: {
              auth: route.auth,
              path: route.path,
              surface: route.surface,
              version: route.version,
            },
          }),
        /Internal API access policy blocked this request IP address/
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("internal route access policy blocks admin requests outside allowed admin ranges", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-admin-access-policy-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.security.internalApiAllowedIps = ["127.0.0.1/32"]
    config.security.adminAllowedIps = ["10.0.0.0/24"]

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
      const route = routes.find(
        (candidate) => candidate.method === "GET" && candidate.path === "/internal/v1/cxapp/runtime-settings"
      )

      assert.ok(route)

      await assert.rejects(
        () =>
          route.handler({
            appSuite,
            config,
            databases: runtime,
            request: {
              method: "GET",
              pathname: "/internal/v1/cxapp/runtime-settings",
              url: new URL("http://localhost/internal/v1/cxapp/runtime-settings"),
              headers: {
                authorization: `Bearer ${adminLogin.accessToken}`,
              },
              remoteAddress: "127.0.0.1",
              bodyText: null,
              jsonBody: null,
            },
            route: {
              auth: route.auth,
              path: route.path,
              surface: route.surface,
              version: route.version,
            },
          }),
        /Admin access policy blocked this request IP address/
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
