import assert from "node:assert/strict"
import test from "node:test"

import { createInternalApiRoutes } from "../../../apps/api/src/internal/routes.js"
import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"

test("internal route registry includes the framework developer operations endpoint", () => {
  const routes = createInternalApiRoutes(createAppSuite())
  const routePaths = routes.map((route) => `${route.method} ${route.path}`)

  assert.ok(routePaths.includes("POST /internal/v1/framework/developer-operations"))
})
