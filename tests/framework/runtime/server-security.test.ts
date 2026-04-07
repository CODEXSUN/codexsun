import assert from "node:assert/strict"
import test from "node:test"

import type { ServerConfig } from "../../../apps/framework/src/runtime/config/server-config.js"
import {
  createHttpsRedirectUrl,
  isRequestSecure,
  readForwardedProtocol,
} from "../../../apps/framework/src/server/index.js"

function createConfig(): ServerConfig {
  return {
    environment: "production",
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
      jwtExpiresInSeconds: 28_800,
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
    billing: {
      compliance: {
        financialYearStartMonth: 4,
        financialYearStartDay: 1,
        eInvoice: {
          enabled: false,
          mode: "mock",
        },
        eWayBill: {
          enabled: false,
          mode: "mock",
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

test("server security reads forwarded https headers", () => {
  assert.equal(readForwardedProtocol({ "x-forwarded-proto": "https" }), "https")
  assert.equal(readForwardedProtocol({ "cf-visitor": '{"scheme":"https"}' }), "https")
  assert.equal(readForwardedProtocol({}), null)
})

test("server security detects secure requests from direct https and forwarded https", () => {
  assert.equal(isRequestSecure({}, "https"), true)
  assert.equal(isRequestSecure({ "x-forwarded-proto": "https" }, "http"), true)
  assert.equal(isRequestSecure({}, "http"), false)
})

test("server security builds https redirect urls preserving path and query", () => {
  const config = createConfig()
  const requestUrl = new URL("http://shop.example.com/storefront/product?id=prod-1")

  assert.equal(
    createHttpsRedirectUrl(requestUrl, { host: "shop.example.com:3000" }, config),
    "https://shop.example.com:3443/storefront/product?id=prod-1"
  )
})
