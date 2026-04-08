import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { buildReleaseEnvReport } from "../../apps/cli/src/release-env-check.js"

const managedEnvKeys = [
  "APP_ENV",
  "APP_DOMAIN",
  "FRONTEND_DOMAIN",
  "TLS_ENABLED",
  "CLOUDFLARE_ENABLED",
  "TLS_KEY_PATH",
  "TLS_CERT_PATH",
  "DB_DRIVER",
  "SQLITE_FILE",
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "DB_SSL",
  "JWT_SECRET",
  "AUTH_OTP_DEBUG",
  "SECRET_OWNER_EMAIL",
  "OPERATIONS_OWNER_EMAIL",
  "SECRETS_LAST_ROTATED_AT",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM_EMAIL",
  "RAZORPAY_ENABLED",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "DB_BACKUP_ENABLED",
  "GDRIVE_BACKUP_ENABLED",
  "GDRIVE_CLIENT_ID",
  "GDRIVE_CLIENT_SECRET",
  "GDRIVE_REFRESH_TOKEN",
  "GDRIVE_FOLDER_ID",
  "OPS_ALERT_EMAILS",
  "OPS_ALERT_WEBHOOK_URL",
  "ADMIN_ALLOWED_IPS",
  "INTERNAL_API_ALLOWED_IPS",
] as const

function withClearedManagedEnv(run: () => void) {
  const previous = new Map<string, string | undefined>()

  for (const key of managedEnvKeys) {
    previous.set(key, process.env[key])
    delete process.env[key]
  }

  try {
    run()
  } finally {
    for (const key of managedEnvKeys) {
      const value = previous.get(key)

      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test("release env check reports blockers for development-style runtime settings", () => {
  withClearedManagedEnv(() => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-release-env-dev-"))

    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "APP_ENV=development",
        "APP_DOMAIN=api.codexsun.local",
        "FRONTEND_DOMAIN=app.codexsun.local",
        "TLS_ENABLED=false",
        "DB_DRIVER=sqlite",
        "SQLITE_FILE=storage/runtime.sqlite",
        "SMTP_HOST=smtp.example.com",
        "SMTP_PORT=587",
        "SMTP_SECURE=false",
        "SMTP_USER=mailer@example.com",
        "SMTP_PASS=test-pass",
        "SMTP_FROM_EMAIL=mailer@example.com",
        "RAZORPAY_ENABLED=true",
        "RAZORPAY_KEY_ID=rzp_live_key",
        "RAZORPAY_KEY_SECRET=rzp_live_secret",
        "DB_BACKUP_ENABLED=true",
      ].join("\n"),
      "utf8"
    )

    const report = buildReleaseEnvReport(tempRoot)

    assert.equal(report.environment, "development")
    assert.ok(report.summary.blockerCount > 0)
    assert.ok(report.checks.some((item) => item.key === "environment" && item.severity === "blocker"))
    assert.ok(report.checks.some((item) => item.key === "razorpay" && item.severity === "blocker"))
  })
})

test("release env check passes a production-like config with owner, alert, and backup targets", () => {
  withClearedManagedEnv(() => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-release-env-prod-"))

    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "APP_ENV=production",
        "APP_DOMAIN=api.example.com",
        "FRONTEND_DOMAIN=shop.example.com",
        "TLS_ENABLED=true",
        "CLOUDFLARE_ENABLED=true",
        "TLS_KEY_PATH=storage/tls/server.key",
        "TLS_CERT_PATH=storage/tls/server.crt",
        "DB_DRIVER=mariadb",
        "DB_HOST=localhost",
        "DB_NAME=codexsun",
        "DB_USER=codexsun",
        "DB_PASSWORD=db-pass",
        "DB_SSL=true",
        "JWT_SECRET=production-secret-value-1234",
        "AUTH_OTP_DEBUG=false",
        "SECRET_OWNER_EMAIL=security@example.com",
        "OPERATIONS_OWNER_EMAIL=ops@example.com",
        "SECRETS_LAST_ROTATED_AT=2026-04-08",
        "SMTP_HOST=smtp.example.com",
        "SMTP_PORT=587",
        "SMTP_SECURE=false",
        "SMTP_USER=mailer@example.com",
        "SMTP_PASS=test-pass",
        "SMTP_FROM_EMAIL=mailer@example.com",
        "RAZORPAY_ENABLED=true",
        "RAZORPAY_KEY_ID=rzp_live_key",
        "RAZORPAY_KEY_SECRET=rzp_live_secret",
        "RAZORPAY_WEBHOOK_SECRET=rzp_webhook_secret",
        "DB_BACKUP_ENABLED=true",
        "GDRIVE_BACKUP_ENABLED=true",
        "GDRIVE_CLIENT_ID=client-id",
        "GDRIVE_CLIENT_SECRET=client-secret",
        "GDRIVE_REFRESH_TOKEN=refresh-token",
        "GDRIVE_FOLDER_ID=folder-id",
        "OPS_ALERT_EMAILS=ops@example.com",
        "ADMIN_ALLOWED_IPS=10.0.0.1",
        "INTERNAL_API_ALLOWED_IPS=10.0.0.2/32",
      ].join("\n"),
      "utf8"
    )

    mkdirSync(path.join(tempRoot, "storage", "tls"), { recursive: true })
    writeFileSync(path.join(tempRoot, "storage", "tls", "server.key"), "key", "utf8")
    writeFileSync(path.join(tempRoot, "storage", "tls", "server.crt"), "cert", "utf8")

    const report = buildReleaseEnvReport(tempRoot)

    assert.equal(report.environment, "production")
    assert.equal(report.summary.blockerCount, 0)
    assert.ok(report.summary.passCount > 0)
  })
})
