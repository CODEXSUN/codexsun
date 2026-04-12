import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { createInternalApiRoutes } from "../../apps/api/src/internal/routes.js"
import { createAuthService } from "../../apps/cxapp/src/services/service-factory.js"
import { createAppSuite } from "../../apps/framework/src/application/app-suite.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

test("internal route registry includes the Zetro endpoints", () => {
  const routes = createInternalApiRoutes(createAppSuite())
  const routePaths = routes.map((route) => `${route.method} ${route.path}`)

  assert.ok(routePaths.includes("GET /internal/v1/zetro/summary"))
  assert.ok(routePaths.includes("GET /internal/v1/zetro/playbooks"))
  assert.ok(routePaths.includes("GET /internal/v1/zetro/playbook"))
  assert.ok(routePaths.includes("GET /internal/v1/zetro/runs"))
  assert.ok(routePaths.includes("GET /internal/v1/zetro/run"))
  assert.ok(routePaths.includes("POST /internal/v1/zetro/runs"))
  assert.ok(routePaths.includes("POST /internal/v1/zetro/run/events"))
  assert.ok(routePaths.includes("GET /internal/v1/zetro/findings"))
  assert.ok(routePaths.includes("POST /internal/v1/zetro/findings"))
  assert.ok(routePaths.includes("PATCH /internal/v1/zetro/finding"))
  assert.ok(routePaths.includes("GET /internal/v1/zetro/guardrails"))
  assert.ok(routePaths.includes("GET /internal/v1/zetro/settings"))
})

test("authenticated Zetro internal routes return persisted catalog data", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-zetro-routes-"))
  const previousDbDriver = process.env.DB_DRIVER
  const previousSqliteFile = process.env.SQLITE_FILE

  try {
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
      const summaryRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" && candidate.path === "/internal/v1/zetro/summary"
      )
      const playbookRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" && candidate.path === "/internal/v1/zetro/playbook"
      )

      assert.ok(summaryRoute)
      assert.ok(playbookRoute)

      const summaryResponse = await summaryRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/zetro/summary",
          url: new URL("http://localhost/internal/v1/zetro/summary"),
          headers,
          remoteAddress: "127.0.0.1",
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: summaryRoute.auth,
          path: summaryRoute.path,
          surface: summaryRoute.surface,
          version: summaryRoute.version,
        },
      })
      const summaryPayload = JSON.parse(summaryResponse.body) as {
        playbooks: number
        defaultOutputMode: string
        commandExecution: string
      }

      assert.equal(summaryResponse.statusCode, 200)
      assert.equal(summaryPayload.playbooks, 6)
      assert.equal(summaryPayload.defaultOutputMode, "maximum")
      assert.equal(summaryPayload.commandExecution, "disabled")

      const playbookResponse = await playbookRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/zetro/playbook",
          url: new URL("http://localhost/internal/v1/zetro/playbook?id=feature-dev"),
          headers,
          remoteAddress: "127.0.0.1",
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: playbookRoute.auth,
          path: playbookRoute.path,
          surface: playbookRoute.surface,
          version: playbookRoute.version,
        },
      })
      const playbookPayload = JSON.parse(playbookResponse.body) as {
        id: string
        phases: unknown[]
      }

      assert.equal(playbookResponse.statusCode, 200)
      assert.equal(playbookPayload.id, "feature-dev")
      assert.equal(playbookPayload.phases.length, 5)
    } finally {
      await runtime.destroy()
    }
  } finally {
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
