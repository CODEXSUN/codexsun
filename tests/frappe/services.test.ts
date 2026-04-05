import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  listFrappeItemProductSyncLogs,
  syncFrappeItemsToProducts,
} from "../../apps/frappe/src/services/item-service.js"
import {
  listFrappePurchaseReceipts,
  syncFrappePurchaseReceipts,
} from "../../apps/frappe/src/services/purchase-receipt-service.js"
import {
  readFrappeSettings,
  saveFrappeSettings,
} from "../../apps/frappe/src/services/settings-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

function createAdminUser() {
  return {
    id: "auth-user:platform-admin",
    email: "admin@codexsun.local",
    phoneNumber: "9999999999",
    displayName: "Platform Admin",
    actorType: "admin" as const,
    isSuperAdmin: true,
    avatarUrl: null,
    isActive: true,
    organizationName: "Codexsun",
    roles: [],
    permissions: [],
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
  }
}

test("frappe item sync is blocked while ecommerce stays scaffold-only", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-frappe-item-sync-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const adminUser = createAdminUser()
      await assert.rejects(
        () =>
          syncFrappeItemsToProducts(runtime.primary, adminUser, {
            itemIds: ["frappe-item:luna-tote"],
            duplicateMode: "overwrite",
          }),
        /scaffold-only/i
      )

      const logs = await listFrappeItemProductSyncLogs(runtime.primary, adminUser)
      const blockedLog = logs.manager.items.find((item) => item.failureCount === 1)

      assert.ok(logs.manager.items.length >= 2)
      assert.equal(blockedLog?.failureCount, 1)
      assert.match(blockedLog?.summary ?? "", /scaffold-only/i)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("frappe settings save and purchase receipt sync stay inside the connector flow with ecommerce scaffolded", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-frappe-receipts-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const adminUser = createAdminUser()
      await saveFrappeSettings(runtime.primary, adminUser, {
        enabled: true,
        baseUrl: "https://erp.example.test",
        siteName: "codexsun",
        apiKey: "test-key",
        apiSecret: "test-secret",
        timeoutSeconds: 15,
        defaultCompany: "Codexsun Trading Pvt Ltd",
        defaultWarehouse: "Main Warehouse - CS",
        defaultPriceList: "Standard Selling",
        defaultCustomerGroup: "Retail Customer",
        defaultItemGroup: "Ready Goods",
      })

      const storedSettings = await readFrappeSettings(runtime.primary, adminUser)
      const receiptSync = await syncFrappePurchaseReceipts(runtime.primary, adminUser, {
        receiptIds: ["frappe-receipt:2026-0002"],
      })
      const receipts = await listFrappePurchaseReceipts(runtime.primary, adminUser)
      const syncedReceipt = receipts.manager.items.find(
        (item) => item.id === "frappe-receipt:2026-0002"
      )

      assert.equal(storedSettings.settings.isConfigured, true)
      assert.equal(storedSettings.settings.baseUrl, "https://erp.example.test")
      assert.equal(receiptSync.sync.items.length, 1)
      assert.equal(receiptSync.sync.items[0]?.mode, "create")
      assert.equal(receiptSync.sync.items[0]?.linkedProductCount, 0)
      assert.equal(syncedReceipt?.isSyncedLocally, true)
      assert.equal(syncedReceipt?.linkedProductCount, 0)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
