import assert from "node:assert/strict"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  getRuntimeSettingsSnapshot,
  saveRuntimeSettings,
} from "../../apps/framework/src/runtime/config/runtime-settings-service.js"

test("runtime settings snapshot resolves env-backed values and save persists grouped env content", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-runtime-settings-"))

  try {
    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "APP_NAME=codexsun-test",
        "APP_HTTP_PORT=4100",
        "DB_DRIVER=sqlite",
        "SQLITE_FILE=storage/local.sqlite",
        "UNMANAGED_KEY=keep-me",
      ].join("\n"),
      "utf8"
    )

    const snapshot = getRuntimeSettingsSnapshot(tempRoot)

    assert.equal(snapshot.values.APP_NAME, "codexsun-test")
    assert.equal(snapshot.values.APP_HTTP_PORT, "4100")
    assert.equal(snapshot.values.DB_DRIVER, "sqlite")
    assert.equal(snapshot.values.SQLITE_FILE, "storage/local.sqlite")

    const saveResponse = await saveRuntimeSettings(
      {
        restart: false,
        values: {
          ...snapshot.values,
          APP_NAME: "codexsun-runtime",
          APP_HTTP_PORT: "4200",
          DB_DRIVER: "sqlite",
          SQLITE_FILE: "storage/runtime.sqlite",
          SMTP_HOST: "smtp.example.com",
          SMTP_PORT: "587",
          SMTP_SECURE: false,
        },
      },
      tempRoot
    )

    const envContents = readFileSync(path.join(tempRoot, ".env"), "utf8")

    assert.equal(saveResponse.saved, true)
    assert.equal(saveResponse.restartScheduled, false)
    assert.match(envContents, /APP_NAME=codexsun-runtime/)
    assert.match(envContents, /APP_HTTP_PORT=4200/)
    assert.match(envContents, /SQLITE_FILE=storage\/runtime\.sqlite/)
    assert.match(envContents, /SMTP_HOST=smtp\.example\.com/)
    assert.match(envContents, /UNMANAGED_KEY=keep-me/)
    assert.match(envContents, /# Application/)
    assert.match(envContents, /# Additional/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("runtime settings save with restart updates the watched restart token in development mode", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-runtime-restart-"))

  try {
    mkdirSync(path.join(tempRoot, "apps/cxapp/src/server"), { recursive: true })
    writeFileSync(
      path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"),
      'export const runtimeRestartToken = "before"\n',
      "utf8"
    )

    const snapshot = getRuntimeSettingsSnapshot(tempRoot)

    const saveResponse = await saveRuntimeSettings(
      {
        restart: true,
        values: snapshot.values,
      },
      tempRoot
    )

    const tokenContents = readFileSync(
      path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"),
      "utf8"
    )

    assert.equal(existsSync(path.join(tempRoot, ".env")), true)
    assert.equal(saveResponse.restartScheduled, true)
    assert.match(tokenContents, /runtimeRestartToken/)
    assert.doesNotMatch(tokenContents, /"before"/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
