import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../../apps/framework/src/runtime/database/index.js"
import {
  getMonitoringDashboard,
  recordMonitoringEvent,
} from "../../../apps/framework/src/runtime/monitoring/monitoring-service.js"

test("monitoring dashboard summarizes threshold breaches and recent failures", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-monitoring-runtime-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.observability.thresholds.checkoutFailures = 2
    config.observability.thresholds.paymentVerifyFailures = 1
    config.observability.thresholds.webhookFailures = 2
    config.observability.thresholds.orderCreationFailures = 3
    config.observability.thresholds.mailFailures = 1
    config.observability.thresholds.connectorSyncFailures = 1
    config.observability.alertEmails = ["ops@example.com"]
    config.observability.alertWebhookUrl = "https://hooks.example.com/ops"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await recordMonitoringEvent(runtime.primary, {
        sourceApp: "ecommerce",
        operation: "checkout",
        status: "failure",
        message: "Checkout failed once.",
      })
      await recordMonitoringEvent(runtime.primary, {
        sourceApp: "ecommerce",
        operation: "checkout",
        status: "failure",
        message: "Checkout failed twice.",
      })
      await recordMonitoringEvent(runtime.primary, {
        sourceApp: "ecommerce",
        operation: "payment_verify",
        status: "failure",
        message: "Payment verification failed.",
      })
      await recordMonitoringEvent(runtime.primary, {
        sourceApp: "cxapp",
        operation: "mail_send",
        status: "success",
        message: "Mail sent.",
      })
      await recordMonitoringEvent(runtime.primary, {
        sourceApp: "frappe",
        operation: "connector_sync",
        status: "failure",
        message: "Connector sync failed.",
      })

      const dashboard = await getMonitoringDashboard(runtime.primary, config, {
        windowHours: 24,
      })

      const checkoutSummary = dashboard.summaries.find(
        (item) => item.operation === "checkout"
      )
      const paymentVerifySummary = dashboard.summaries.find(
        (item) => item.operation === "payment_verify"
      )
      const mailSummary = dashboard.summaries.find(
        (item) => item.operation === "mail_send"
      )
      const connectorSummary = dashboard.summaries.find(
        (item) => item.operation === "connector_sync"
      )

      assert.equal(dashboard.channels.hasEmailTargets, true)
      assert.equal(dashboard.channels.hasWebhookTarget, true)
      assert.equal(checkoutSummary?.failureCount, 2)
      assert.equal(checkoutSummary?.alertState, "breached")
      assert.equal(paymentVerifySummary?.failureCount, 1)
      assert.equal(paymentVerifySummary?.alertState, "breached")
      assert.equal(mailSummary?.successCount, 1)
      assert.equal(mailSummary?.alertState, "healthy")
      assert.equal(connectorSummary?.failureCount, 1)
      assert.equal(connectorSummary?.alertState, "breached")
      assert.equal(dashboard.recentFailures.length >= 3, true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
