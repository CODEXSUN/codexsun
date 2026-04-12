import assert from "node:assert/strict"
import test from "node:test"

import { createPublicApiRoutes } from "../../../apps/api/src/external/public-routes.js"
import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"

test("public route registry includes the managed brand asset endpoints", () => {
  const routes = createPublicApiRoutes(createAppSuite())
  const routePaths = routes.map((route) => `${route.method} ${route.path}`)

  assert.ok(routePaths.includes("GET /public/v1/brand-logo"))
  assert.ok(routePaths.includes("GET /public/v1/brand-logo-dark"))
  assert.ok(routePaths.includes("GET /public/v1/brand-favicon"))
})
