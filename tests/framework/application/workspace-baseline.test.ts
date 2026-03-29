import assert from "node:assert/strict"
import test from "node:test"

import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"
import { createWorkspaceHostBaseline } from "../../../apps/framework/src/application/workspace-baseline.js"

test("workspace host baseline exposes the active shell, host roots, and standard app shape", () => {
  const baseline = createWorkspaceHostBaseline(createAppSuite())

  assert.equal(baseline.activeShell.appId, "cxapp")
  assert.equal(baseline.activeShell.webEntry, "apps/cxapp/web/src/main.tsx")
  assert.equal(baseline.frameworkHost.serverEntry, "apps/framework/src/server/index.ts")
  assert.deepEqual(baseline.standardAppShape, [
    "src",
    "web",
    "database/migration",
    "database/seeder",
    "helper",
    "shared",
  ])
  assert.equal(baseline.framework.id, "framework")
  assert.equal(baseline.apps[0]?.id, "cxapp")
})
