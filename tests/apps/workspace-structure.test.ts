import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { createAppSuite } from "../../apps/framework/src/application/app-suite.js"

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))

test("every registered app exposes the standard isolated workspace shape", () => {
  const suite = createAppSuite()
  const manifests = [suite.framework, ...suite.apps]

  for (const manifest of manifests) {
    const requiredRoots = [
      manifest.workspace.backendRoot,
      manifest.workspace.frontendRoot,
      manifest.workspace.helperRoot,
      manifest.workspace.sharedRoot,
      manifest.workspace.migrationRoot,
      manifest.workspace.seederRoot,
    ]

    for (const workspaceRoot of requiredRoots) {
      assert.ok(
        existsSync(path.join(repoRoot, workspaceRoot)),
        `${manifest.id} is missing ${workspaceRoot}`
      )
    }
  }
})
