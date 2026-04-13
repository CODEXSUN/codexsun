import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"
import { createRuntimeDatabases } from "../../../apps/framework/src/runtime/database/index.js"

function withClearedEnv<T>(keys: readonly string[], run: () => T) {
  const previous = new Map<string, string | undefined>()

  for (const key of keys) {
    previous.set(key, process.env[key])
    delete process.env[key]
  }

  try {
    return run()
  } finally {
    for (const key of keys) {
      const value = previous.get(key)

      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test("database runtime provisions a MariaDB primary connection and no offline database", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-db-"))

  try {
    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "DB_DRIVER=mariadb",
        "DB_HOST=127.0.0.1",
        "DB_PORT=3306",
        "DB_NAME=codexsun",
        "DB_USER=root",
      ].join("\n"),
      "utf8"
    )

    const config = withClearedEnv(["DB_DRIVER"], () => getServerConfig(tempRoot))
    config.database.driver = "mariadb"
    config.database.host = "127.0.0.1"
    config.database.port = 3306
    config.database.name = "codexsun"
    config.database.user = "root"

    const runtime = createRuntimeDatabases(config)

    assert.equal(runtime.metadata.primaryDriver, "mariadb")
    assert.equal(runtime.metadata.offlineEnabled, false)
    assert.equal(runtime.offline, undefined)

    await runtime.destroy()
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
