import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"

test("server config reads domain, port, db driver, and offline flags from .env", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-config-"))

  try {
    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "APP_HOST=0.0.0.0",
        "APP_DOMAIN=api.example.test",
        "APP_HTTP_PORT=3000",
        "APP_HTTPS_PORT=3443",
        "APP_NAME=codexsun",
        "FRONTEND_DOMAIN=app.example.test",
        "FRONTEND_HTTP_PORT=5173",
        "FRONTEND_HTTPS_PORT=5174",
        "DB_DRIVER=mariadb",
        "DB_HOST=127.0.0.1",
        "DB_PORT=3306",
        "DB_NAME=codexsun",
        "DB_USER=root",
        "OFFLINE_SUPPORT_ENABLED=true",
        "SQLITE_FILE=storage/desktop/offline.sqlite",
      ].join("\n")
    )

    const config = getServerConfig(tempRoot)

    assert.equal(config.appDomain, "api.example.test")
    assert.equal(config.appHttpPort, 3000)
    assert.equal(config.appHttpsPort, 3443)
    assert.equal(config.frontendDomain, "app.example.test")
    assert.equal(config.database.driver, "mariadb")
    assert.equal(config.offline.enabled, true)
    assert.match(config.offline.sqliteFile, /offline\.sqlite$/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
