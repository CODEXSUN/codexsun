import assert from "node:assert/strict"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  getRuntimeSettingsSnapshot,
  saveRuntimeSettings,
} from "../../apps/framework/src/runtime/config/runtime-settings-service.js"

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

const runtimeEnvKeys = [
  "APP_ENV",
  "APP_NAME",
  "APP_HTTP_PORT",
  "GIT_SYNC_ENABLED",
  "GIT_REPOSITORY_URL",
  "GIT_BRANCH",
  "GIT_AUTO_UPDATE_ON_START",
  "GIT_FORCE_UPDATE_ON_START",
  "DB_DRIVER",
  "SQLITE_FILE",
  "AUTH_MAX_LOGIN_ATTEMPTS",
  "AUTH_LOCKOUT_MINUTES",
  "ADMIN_SESSION_IDLE_MINUTES",
  "ADMIN_ALLOWED_IPS",
  "INTERNAL_API_ALLOWED_IPS",
  "SECRET_ROTATION_DAYS",
  "SECRETS_LAST_ROTATED_AT",
  "SECRET_OWNER_EMAIL",
  "OPERATIONS_OWNER_EMAIL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "APP_LOG_LEVEL",
  "OPS_ALERT_EMAILS",
  "OPS_ALERT_WEBHOOK_URL",
  "ALERT_CHECKOUT_FAILURE_THRESHOLD",
  "ALERT_WEBHOOK_FAILURE_THRESHOLD",
  "ALERT_MAIL_FAILURE_THRESHOLD",
  "DB_BACKUP_ENABLED",
  "DB_BACKUP_CADENCE_HOURS",
  "DB_BACKUP_RETENTION_DAYS",
  "DB_BACKUP_LAST_VERIFIED_AT",
  "ADMIN_AUDIT_LOG_ENABLED",
  "SUPPORT_EVENT_LOG_ENABLED",
  "SECURITY_CHECKLIST_LAST_REVIEWED_AT",
] as const

test("runtime settings snapshot resolves env-backed values and save persists grouped env content", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-runtime-settings-"))

  try {
    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "APP_NAME=codexsun-test",
        "APP_HTTP_PORT=4100",
        "GIT_SYNC_ENABLED=true",
        "GIT_REPOSITORY_URL=https://github.com/CODEXSUN/codexsun.git",
        "GIT_BRANCH=release",
        "GIT_AUTO_UPDATE_ON_START=true",
        "GIT_FORCE_UPDATE_ON_START=false",
        "DB_DRIVER=sqlite",
        "SQLITE_FILE=storage/local.sqlite",
        "UNMANAGED_KEY=keep-me",
      ].join("\n"),
      "utf8"
    )

    const snapshot = withClearedEnv(runtimeEnvKeys, () =>
      getRuntimeSettingsSnapshot(tempRoot)
    )

    assert.equal(snapshot.values.APP_NAME, "codexsun-test")
    assert.equal(snapshot.values.APP_ENV, "development")
    assert.equal(snapshot.values.APP_HTTP_PORT, "4100")
    assert.equal(snapshot.values.GIT_SYNC_ENABLED, true)
    assert.equal(snapshot.values.GIT_REPOSITORY_URL, "https://github.com/CODEXSUN/codexsun.git")
    assert.equal(snapshot.values.GIT_BRANCH, "release")
    assert.equal(snapshot.values.GIT_AUTO_UPDATE_ON_START, true)
    assert.equal(snapshot.values.GIT_FORCE_UPDATE_ON_START, false)
    assert.equal(snapshot.values.DB_DRIVER, "sqlite")
    assert.equal(snapshot.values.SQLITE_FILE, "storage/local.sqlite")

    const saveResponse = await withClearedEnv(runtimeEnvKeys, () =>
      saveRuntimeSettings(
        {
          restart: false,
          values: {
            ...snapshot.values,
            APP_NAME: "codexsun-runtime",
            APP_HTTP_PORT: "4200",
            GIT_SYNC_ENABLED: false,
            GIT_REPOSITORY_URL: "https://github.com/CODEXSUN/codexsun.git",
            GIT_BRANCH: "main",
            GIT_AUTO_UPDATE_ON_START: false,
            GIT_FORCE_UPDATE_ON_START: true,
            DB_DRIVER: "sqlite",
            SQLITE_FILE: "storage/runtime.sqlite",
            SMTP_HOST: "smtp.example.com",
            SMTP_PORT: "587",
            SMTP_SECURE: false,
          },
        },
        tempRoot
      )
    )

    const envContents = readFileSync(path.join(tempRoot, ".env"), "utf8")

    assert.equal(saveResponse.saved, true)
    assert.equal(saveResponse.restartScheduled, false)
    assert.match(envContents, /APP_NAME=codexsun-runtime/)
    assert.match(envContents, /APP_ENV=development/)
    assert.match(envContents, /APP_HTTP_PORT=4200/)
    assert.match(envContents, /GIT_SYNC_ENABLED=false/)
    assert.match(envContents, /GIT_REPOSITORY_URL=https:\/\/github\.com\/CODEXSUN\/codexsun\.git/)
    assert.match(envContents, /GIT_BRANCH=main/)
    assert.match(envContents, /GIT_FORCE_UPDATE_ON_START=true/)
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

    const snapshot = withClearedEnv(runtimeEnvKeys, () =>
      getRuntimeSettingsSnapshot(tempRoot)
    )

    const saveResponse = await withClearedEnv(runtimeEnvKeys, () =>
      saveRuntimeSettings(
        {
          restart: true,
          values: snapshot.values,
        },
        tempRoot
      )
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
