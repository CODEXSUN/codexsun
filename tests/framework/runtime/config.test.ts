import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"

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

const configEnvKeys = [
  "APP_ENV",
  "APP_HOST",
  "APP_DOMAIN",
  "APP_HTTP_PORT",
  "APP_HTTPS_PORT",
  "APP_NAME",
  "FRONTEND_DOMAIN",
  "FRONTEND_HTTP_PORT",
  "FRONTEND_HTTPS_PORT",
  "DB_DRIVER",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "SUPER_ADMIN_EMAILS",
  "OFFLINE_SUPPORT_ENABLED",
  "SQLITE_FILE",
  "JWT_SECRET",
  "AUTH_MAX_LOGIN_ATTEMPTS",
  "AUTH_LOCKOUT_MINUTES",
  "ADMIN_SESSION_IDLE_MINUTES",
  "ADMIN_ALLOWED_IPS",
  "INTERNAL_API_ALLOWED_IPS",
  "SECRET_ROTATION_DAYS",
  "SECRETS_LAST_ROTATED_AT",
  "SECRET_OWNER_EMAIL",
  "OPERATIONS_OWNER_EMAIL",
  "AUTH_OTP_DEBUG",
  "TLS_ENABLED",
  "TLS_KEY_PATH",
  "TLS_CERT_PATH",
  "CLOUDFLARE_ENABLED",
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
  "NODE_ENV",
] as const

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
        "SUPER_ADMIN_EMAILS= SUNDAR@SUNDAR.COM , admin@example.com ",
        "OFFLINE_SUPPORT_ENABLED=true",
        "SQLITE_FILE=storage/desktop/offline.sqlite",
      ].join("\n")
    )

    const config = withClearedEnv(configEnvKeys, () => getServerConfig(tempRoot))

    assert.equal(config.appDomain, "api.example.test")
    assert.equal(config.appHttpPort, 3000)
    assert.equal(config.appHttpsPort, 3443)
    assert.equal(config.frontendDomain, "app.example.test")
    assert.equal(config.database.driver, "mariadb")
    assert.deepEqual(config.auth.superAdminEmails, [
      "sundar@sundar.com",
      "admin@example.com",
    ])
    assert.equal(config.offline.enabled, true)
    assert.match(config.offline.sqliteFile, /offline\.sqlite$/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("server config enforces HTTPS-safe production settings", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-config-production-"))

  try {
    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "APP_ENV=production",
        "APP_DOMAIN=api.example.com",
        "FRONTEND_DOMAIN=shop.example.com",
        "JWT_SECRET=production-secret-value-1234",
        "AUTH_OTP_DEBUG=false",
        "SECRET_ROTATION_DAYS=90",
        "SECRETS_LAST_ROTATED_AT=2026-04-07",
        "SECRET_OWNER_EMAIL=security@example.com",
        "OPERATIONS_OWNER_EMAIL=ops@example.com",
        "TLS_ENABLED=true",
        "TLS_KEY_PATH=certs/server.key",
        "TLS_CERT_PATH=certs/server.crt",
      ].join("\n")
    )

    const config = withClearedEnv(configEnvKeys, () => getServerConfig(tempRoot))

    assert.equal(config.environment, "production")
    assert.equal(config.security.httpsOnly, true)
    assert.equal(config.tlsEnabled, true)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("server config rejects insecure production defaults", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-config-production-invalid-"))

  try {
    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "APP_ENV=production",
        "APP_DOMAIN=api.codexsun.local",
        "FRONTEND_DOMAIN=app.codexsun.local",
        "AUTH_OTP_DEBUG=true",
        "TLS_ENABLED=false",
        "CLOUDFLARE_ENABLED=false",
      ].join("\n")
    )

    assert.throws(() => withClearedEnv(configEnvKeys, () => getServerConfig(tempRoot)))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
