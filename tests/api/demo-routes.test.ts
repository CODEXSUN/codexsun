import assert from "node:assert/strict"
import test from "node:test"

import { createInternalApiRoutes } from "../../apps/api/src/internal/routes.js"
import { createAppSuite } from "../../apps/framework/src/application/app-suite.js"

test("internal route registry includes the demo installer endpoints", () => {
  const routes = createInternalApiRoutes(createAppSuite())
  const routePaths = routes.map((route) => `${route.method} ${route.path}`)

  assert.ok(routePaths.includes("GET /internal/v1/demo/summary"))
  assert.ok(routePaths.includes("GET /internal/v1/demo/profiles"))
  assert.ok(routePaths.includes("POST /internal/v1/demo/install"))
  assert.ok(routePaths.includes("GET /internal/v1/demo/job"))
  assert.ok(routePaths.includes("POST /internal/v1/demo/jobs"))
})
