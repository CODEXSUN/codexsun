import assert from "node:assert/strict"
import test from "node:test"

import { createExternalApiRoutes } from "../../../apps/api/src/external/routes.js"
import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"

test("external route registry includes the framework server status endpoint", () => {
  const routes = createExternalApiRoutes(createAppSuite())
  const routePaths = routes.map((route) => `${route.method} ${route.path}`)

  assert.ok(routePaths.includes("GET /api/v1/framework/server-status"))
  assert.ok(routePaths.includes("POST /api/v1/framework/server-control/git-update"))
})
