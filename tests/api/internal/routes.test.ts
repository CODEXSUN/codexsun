import assert from "node:assert/strict"
import test from "node:test"

import { createInternalApiRoutes } from "../../../apps/api/src/internal/routes.js"
import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"

test("internal baseline route exposes the machine-readable workspace host baseline", () => {
  const route = createInternalApiRoutes(createAppSuite()).find(
    (candidate) => candidate.path === "/internal/baseline"
  )

  assert.ok(route)

  const response = route.handler({ appSuite: createAppSuite() })

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
