import test from "node:test"
import assert from "node:assert/strict"

import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"

test("app suite registers framework plus standalone business and integration apps", () => {
  const suite = createAppSuite()
  const appIds = suite.apps.map((app) => app.id)

  assert.equal(suite.framework.id, "framework")
  assert.equal(suite.framework.workspace.appId, "framework")
  assert.deepEqual(appIds, [
    "cxapp",
    "core",
    "api",
    "ui",
    "site",
    "billing",
    "ecommerce",
    "task",
    "frappe",
    "tally",
    "cli",
  ])
})
