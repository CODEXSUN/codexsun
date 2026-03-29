import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"
import { createRuntimeDatabases } from "../../../apps/framework/src/runtime/database/index.js"

test("database runtime provisions sqlite primary and offline database when enabled", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-db-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = true
    config.offline.sqliteFile = path.join(tempRoot, "offline.sqlite")

    const runtime = createRuntimeDatabases(config)

    assert.equal(runtime.metadata.primaryDriver, "sqlite")
    assert.equal(runtime.metadata.offlineEnabled, true)
    assert.ok(runtime.offline)

    await runtime.destroy()
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
