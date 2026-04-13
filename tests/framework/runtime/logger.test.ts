import assert from "node:assert/strict"
import test from "node:test"

import { createRuntimeLogger, resolveRequestId } from "../../../apps/framework/src/runtime/observability/runtime-logger.js"
import type { ServerConfig } from "../../../apps/framework/src/runtime/config/server-config.js"

function createConfig(
  logLevel: ServerConfig["observability"]["logLevel"],
  environment: ServerConfig["environment"] = "production"
): ServerConfig {
  return {
    environment,
    appName: "codexsun",
    appHost: "0.0.0.0",
    appDomain: "api.example.com",
    appHttpPort: 3000,
    appHttpsPort: 3443,
    frontendDomain: "shop.example.com",
    frontendHost: "0.0.0.0",
    frontendHttpPort: 5173,
    frontendHttpsPort: 5174,
    frontendTarget: "shop",
    webRoot: "build/app/cxapp/web",
    tlsEnabled: true,
    tlsKeyPath: "certs/server.key",
    tlsCertPath: "certs/server.crt",
    cloudflareEnabled: false,
    database: {
      driver: "sqlite",
      ssl: false,
      sqliteFile: "storage/desktop/codexsun.sqlite",
    },
    offline: {
      enabled: false,
      sqliteFile: "storage/desktop/codexsun.sqlite",
    },
    analytics: {
      enabled: false,
      driver: "postgres",
      ssl: false,
    },
    security: {
      httpsOnly: true,
      jwtSecret: "production-secret-value-1234",
      jwtExpiresInSeconds: 28800,
      authMaxLoginAttempts: 5,
      authLockoutMinutes: 30,
      adminSessionIdleMinutes: 30,
      adminAllowedIps: [],
      internalApiAllowedIps: [],
      secretRotationDays: 90,
      secretsLastRotatedAt: "2026-04-07",
      secretOwnerEmail: "security@example.com",
      operationsOwnerEmail: "ops@example.com",
    },
    auth: {
      otpDebug: false,
      otpExpiryMinutes: 10,
      superAdminEmails: [],
    },
    notifications: {
      email: {
        enabled: false,
        host: "smtp.example.com",
        port: 465,
        secure: true,
        fromName: "codexsun",
      },
      toast: {
        position: "top-right",
        tone: "soft",
      },
    },
    observability: {
      logLevel,
      alertEmails: [],
      thresholds: {
        checkoutFailures: 5,
        paymentVerifyFailures: 3,
        webhookFailures: 3,
        orderCreationFailures: 5,
        mailFailures: 10,
        connectorSyncFailures: 3,
      },
    },
    operations: {
      backups: {
        enabled: true,
        cadenceHours: 24,
        retentionDays: 14,
      },
      audit: {
        adminAuditEnabled: true,
        supportEventLoggingEnabled: true,
      },
    },
    billing: {
      compliance: {
        financialYearStartMonth: 4,
        financialYearStartDay: 1,
        eInvoice: {
          enabled: false,
          mode: "manual",
        },
        eWayBill: {
          enabled: false,
          mode: "manual",
        },
      },
    },
    commerce: {
      storefront: {
        freeShippingThreshold: 3999,
        defaultShippingAmount: 149,
      },
      razorpay: {
        enabled: false,
        businessName: "Tirupur Direct",
      },
    },
  }
}

test("runtime logger emits structured json records honoring log level", () => {
  const output: string[] = []
  const logger = createRuntimeLogger(createConfig("warn"), {
    debug: (entry) => output.push(entry),
    info: (entry) => output.push(entry),
    warn: (entry) => output.push(entry),
    error: (entry) => output.push(entry),
  })

  logger.info("runtime.ready")
  logger.warn("http.request.application_error", { requestId: "req-1", statusCode: 400 })

  assert.equal(output.length, 1)

  const record = JSON.parse(output[0] ?? "{}") as {
    level: string
    event: string
    requestId?: string
    statusCode?: number
  }

  assert.equal(record.level, "warn")
  assert.equal(record.event, "http.request.application_error")
  assert.equal(record.requestId, "req-1")
  assert.equal(record.statusCode, 400)
})

test("runtime logger emits readable development records", () => {
  const output: string[] = []
  const logger = createRuntimeLogger(createConfig("info", "development"), {
    debug: (entry) => output.push(entry),
    info: (entry) => output.push(entry),
    warn: (entry) => output.push(entry),
    error: (entry) => output.push(entry),
  })

  logger.info("runtime.ready")
  logger.warn("operations.backup.scheduler_unsupported", {
    driver: "mariadb",
    reason: "Backup execution is not available.",
  })

  assert.equal(output.length, 2)
  assert.match(output[0] ?? "", /^\[\d{2}:\d{2}:\d{2}\] INFO runtime\.ready$/)
  assert.match(
    output[1] ?? "",
    /^\[\d{2}:\d{2}:\d{2}\] WARN operations\.backup\.scheduler_unsupported driver=mariadb reason="Backup execution is not available\."$/
  )
})

test("runtime logger resolves incoming request ids safely", () => {
  assert.equal(resolveRequestId(" req-123 "), "req-123")
  assert.equal(resolveRequestId(["req-456"]), "req-456")
  assert.equal(resolveRequestId(undefined), null)
})
