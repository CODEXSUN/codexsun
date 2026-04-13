import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import { startDatabaseBackupScheduler } from "../../apps/framework/src/runtime/operations/database-backup-service.js"

test("database backup scheduler does not start when backup execution is unsupported", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-backup-scheduler-"))
  const previousEnv = {
    DB_DRIVER: process.env.DB_DRIVER,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
  }

  try {
    writeFileSync(
      path.join(tempRoot, ".env"),
      ["DB_DRIVER=mariadb", "DB_HOST=127.0.0.1", "DB_PORT=3306", "DB_NAME=codexsun", "DB_USER=root", "DB_PASSWORD=test"].join("\n"),
      "utf8"
    )
    process.env.DB_DRIVER = "mariadb"
    process.env.DB_HOST = "127.0.0.1"
    process.env.DB_PORT = "3306"
    process.env.DB_NAME = "codexsun"
    process.env.DB_USER = "root"
    process.env.DB_PASSWORD = "test"

    const config = getServerConfig(tempRoot)
    config.operations.backups.enabled = true

    const warnings: Array<{ event: string; payload: Record<string, unknown> | undefined }> = []
    const stop = startDatabaseBackupScheduler({
      config,
      databases: {
        primary: {} as never,
        metadata: {
          primaryDriver: config.database.driver,
          offlineEnabled: false,
          analyticsEnabled: false,
        },
        destroy: async () => undefined,
      },
      logger: {
        warn: (event: string, payload?: Record<string, unknown>) => {
          warnings.push({ event, payload })
        },
      } as never,
    })

    assert.equal(typeof stop, "function")
    assert.equal(warnings.length, 1)
    assert.equal(warnings[0]?.event, "operations.backup.scheduler_unsupported")
    assert.match(String(warnings[0]?.payload?.reason ?? ""), /not yet implemented/i)

    stop()
  } finally {
    process.env.DB_DRIVER = previousEnv.DB_DRIVER
    process.env.DB_HOST = previousEnv.DB_HOST
    process.env.DB_PORT = previousEnv.DB_PORT
    process.env.DB_NAME = previousEnv.DB_NAME
    process.env.DB_USER = previousEnv.DB_USER
    process.env.DB_PASSWORD = previousEnv.DB_PASSWORD
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
