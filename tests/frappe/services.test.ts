import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  listFrappeItems,
  listFrappeItemProductSyncLogs,
  syncFrappeItemsToProducts,
} from "../../apps/frappe/src/services/item-service.js"
import { listProducts } from "../../apps/core/src/services/product-service.js"
import {
  listFrappePurchaseReceipts,
  syncFrappePurchaseReceipts,
} from "../../apps/frappe/src/services/purchase-receipt-service.js"
import { pushStorefrontOrderToFrappeSalesOrder } from "../../apps/frappe/src/services/sales-order-service.js"
import {
  readFrappeTransactionReconciliationQueue,
  replayFrappeTransactionSync,
  syncFrappeDeliveryNoteToEcommerce,
  syncFrappeInvoiceToEcommerce,
  syncFrappeReturnToEcommerce,
} from "../../apps/frappe/src/services/transaction-sync-service.js"
import {
  readFrappeSettings,
  saveFrappeSettings,
  verifyFrappeSettings,
} from "../../apps/frappe/src/services/settings-service.js"
import { readFrappeObservabilityReport } from "../../apps/frappe/src/services/observability-service.js"
import { readFrappeItemProjectionContract } from "../../apps/frappe/src/services/item-projection-contract-service.js"
import { readFrappePriceProjectionContract } from "../../apps/frappe/src/services/price-projection-contract-service.js"
import { readFrappeStockProjectionContract } from "../../apps/frappe/src/services/stock-projection-contract-service.js"
import { readFrappeCustomerCommercialProfileContract } from "../../apps/frappe/src/services/customer-commercial-profile-contract-service.js"
import { readFrappeSalesOrderPushPolicy } from "../../apps/frappe/src/services/sales-order-policy-service.js"
import { readFrappeSyncPolicy } from "../../apps/frappe/src/services/sync-policy-service.js"
import { frappeTableNames } from "../../apps/frappe/database/table-names.js"
import {
  attachStorefrontOrderErpSalesOrderLink,
  createCheckoutOrder,
  getStorefrontOrderForConnector,
  verifyCheckoutPayment,
} from "../../apps/ecommerce/src/services/order-service.js"
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

test("frappe item sync projects unsynced item snapshots into core products", async () => {
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
      const sync = await syncFrappeItemsToProducts(runtime.primary, adminUser, {
        itemIds: ["frappe-item:luna-tote"],
        duplicateMode: "overwrite",
      })

      const logs = await listFrappeItemProductSyncLogs(runtime.primary, adminUser)
      const products = await listProducts(runtime.primary)
      const syncedProduct = products.items.find((item) => item.code === "LUNA-TOTE-01")
      const syncLog = logs.manager.items.find((item) => item.id === sync.sync.summary.logId)

      assert.ok(logs.manager.items.length >= 2)
      assert.equal(sync.sync.summary.successCount, 1)
      assert.equal(sync.sync.summary.failureCount, 0)
      assert.equal(sync.sync.items[0]?.mode, "create")
      assert.equal(sync.sync.items[0]?.frappeItemCode, "LUNA-TOTE-01")
      assert.equal(syncedProduct?.name, "Luna Utility Tote")
      assert.equal(syncedProduct?.sku, "LUNA-TOTE-01")
      assert.equal(syncedProduct?.brandName, "Luna Works")
      assert.equal(syncedProduct?.productGroupName, "Accessories")
      assert.equal(syncedProduct?.isActive, true)
      assert.equal(syncLog?.successCount, 1)
      assert.match(syncLog?.summary ?? "", /1 synced, 0 skipped, 0 failed/i)
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
      assert.equal(storedSettings.settings.apiKey, "")
      assert.equal(storedSettings.settings.apiSecret, "")
      assert.equal(storedSettings.settings.hasApiKey, true)
      assert.equal(storedSettings.settings.hasApiSecret, true)
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

test("frappe settings preserve saved secrets across non-secret updates and persist saved-setting verification", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-frappe-verify-"))

  const originalFetch = globalThis.fetch

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
        baseUrl: "https://erp.example.test/",
        siteName: "codexsun",
        apiKey: "saved-key",
        apiSecret: "saved-secret",
        timeoutSeconds: 15,
        defaultCompany: "Codexsun Trading Pvt Ltd",
        defaultWarehouse: "Main Warehouse - CS",
        defaultPriceList: "Standard Selling",
        defaultCustomerGroup: "Retail Customer",
        defaultItemGroup: "Ready Goods",
      })

      await saveFrappeSettings(runtime.primary, adminUser, {
        enabled: true,
        baseUrl: "https://erp.example.test",
        siteName: "codexsun-prod",
        apiKey: "",
        apiSecret: "",
        timeoutSeconds: 30,
        defaultCompany: "Codexsun Trading Pvt Ltd",
        defaultWarehouse: "Secondary Warehouse - CS",
        defaultPriceList: "Standard Selling",
        defaultCustomerGroup: "Retail Customer",
        defaultItemGroup: "Ready Goods",
      })

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: "connector@example.test" }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        })

      const verification = await verifyFrappeSettings(
        runtime.primary,
        adminUser,
        {}
      )
      const storedSettings = await readFrappeSettings(runtime.primary, adminUser)

      assert.equal(verification.verification.ok, true)
      assert.equal(verification.verification.usedSavedCredentials, true)
      assert.equal(verification.verification.persistedToSettings, true)
      assert.equal(storedSettings.settings.isConfigured, true)
      assert.equal(storedSettings.settings.baseUrl, "https://erp.example.test")
      assert.equal(storedSettings.settings.siteName, "codexsun-prod")
      assert.equal(storedSettings.settings.defaultWarehouse, "Secondary Warehouse - CS")
      assert.equal(storedSettings.settings.apiKey, "")
      assert.equal(storedSettings.settings.apiSecret, "")
      assert.equal(storedSettings.settings.hasApiKey, true)
      assert.equal(storedSettings.settings.hasApiSecret, true)
      assert.equal(storedSettings.settings.lastVerificationStatus, "passed")
      assert.equal(
        storedSettings.settings.lastVerificationMessage,
        "ERPNext connection verified."
      )
      assert.match(storedSettings.settings.lastVerifiedAt, /\d{4}-\d{2}-\d{2}T/)
    } finally {
      globalThis.fetch = originalFetch
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("frappe sync policy derives timeout and retry guardrails from saved connector settings", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-frappe-sync-policy-"))

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
        apiKey: "saved-key",
        apiSecret: "saved-secret",
        timeoutSeconds: 45,
        defaultCompany: "Codexsun Trading Pvt Ltd",
        defaultWarehouse: "Main Warehouse - CS",
        defaultPriceList: "Standard Selling",
        defaultCustomerGroup: "Retail Customer",
        defaultItemGroup: "Ready Goods",
      })

      const policy = await readFrappeSyncPolicy(runtime.primary, adminUser)
      const erpReadPolicy = policy.policy.policies.find(
        (item) => item.operationKey === "erp-read"
      )
      const projectionPolicy = policy.policy.policies.find(
        (item) => item.operationKey === "projection-write"
      )

      assert.equal(policy.policy.connectorEnabled, true)
      assert.equal(policy.policy.verificationStatus, "idle")
      assert.equal(erpReadPolicy?.maxAttempts, 3)
      assert.deepEqual(erpReadPolicy?.backoffSeconds, [5, 30])
      assert.equal(erpReadPolicy?.timeoutSeconds, 45)
      assert.equal(projectionPolicy?.retryable, false)
      assert.match(
        policy.policy.operatorRules.join(" "),
        /fail closed|manual-replay/i
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("frappe services tolerate legacy settings rows without derived verification fields", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-frappe-legacy-settings-"))

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
        apiKey: "saved-key",
        apiSecret: "saved-secret",
        timeoutSeconds: 25,
        defaultCompany: "Codexsun Trading Pvt Ltd",
        defaultWarehouse: "Main Warehouse - CS",
        defaultPriceList: "Standard Selling",
        defaultCustomerGroup: "Retail Customer",
        defaultItemGroup: "Ready Goods",
      })

      const database = runtime.primary as {
        selectFrom: (table: string) => {
          select: (columns: string[]) => {
            where: (column: string, op: string, value: string) => {
              executeTakeFirst: () => Promise<{ payload: string } | undefined>
            }
          }
        }
        updateTable: (table: string) => {
          set: (values: Record<string, unknown>) => {
            where: (column: string, op: string, value: string) => {
              execute: () => Promise<unknown>
            }
          }
        }
      }
      const row = await database
        .selectFrom(frappeTableNames.settings)
        .select(["payload"])
        .where("id", "=", "frappe-settings:default")
        .executeTakeFirst()

      assert.ok(row)

      const legacyPayload = JSON.parse(row.payload) as Record<string, unknown>
      delete legacyPayload.hasApiKey
      delete legacyPayload.hasApiSecret
      delete legacyPayload.lastVerifiedAt
      delete legacyPayload.lastVerificationStatus
      delete legacyPayload.lastVerificationMessage
      delete legacyPayload.lastVerificationDetail

      await database
        .updateTable(frappeTableNames.settings)
        .set({ payload: JSON.stringify(legacyPayload) })
        .where("id", "=", "frappe-settings:default")
        .execute()

      const [settings, items, receipts, syncPolicy, salesOrderPolicy] =
        await Promise.all([
          readFrappeSettings(runtime.primary, adminUser),
          listFrappeItems(runtime.primary, adminUser),
          listFrappePurchaseReceipts(runtime.primary, adminUser),
          readFrappeSyncPolicy(runtime.primary, adminUser),
          readFrappeSalesOrderPushPolicy(runtime.primary, adminUser),
        ])

      assert.equal(settings.settings.hasApiKey, true)
      assert.equal(settings.settings.hasApiSecret, true)
      assert.equal(settings.settings.lastVerificationStatus, "idle")
      assert.equal(items.manager.references.defaults.company, "Codexsun Trading Pvt Ltd")
      assert.equal(
        receipts.manager.references.defaults.warehouse,
        "Main Warehouse - CS"
      )
      assert.equal(syncPolicy.policy.connectorEnabled, true)
      assert.equal(syncPolicy.policy.verificationStatus, "idle")
      assert.equal(salesOrderPolicy.policy.connectorEnabled, true)
      assert.equal(salesOrderPolicy.policy.verificationStatus, "idle")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("paid storefront orders push into ERPNext Sales Order once and reuse the local sync record on duplicates", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-frappe-sales-orders-"))
  const originalFetch = globalThis.fetch

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const adminUser = createAdminUser()
      await saveFrappeSettings(runtime.primary, adminUser, {
        enabled: true,
        baseUrl: "https://erp.example.test",
        siteName: "codexsun",
        apiKey: "saved-key",
        apiSecret: "saved-secret",
        timeoutSeconds: 20,
        defaultCompany: "Codexsun Trading Pvt Ltd",
        defaultWarehouse: "Main Warehouse - CS",
        defaultPriceList: "Standard Selling",
        defaultCustomerGroup: "Retail Customer",
        defaultItemGroup: "Ready Goods",
      })

      globalThis.fetch = async (input, init) => {
        const url = String(input)

        if (url.endsWith("/api/method/frappe.auth.get_logged_user")) {
          return new Response(JSON.stringify({ message: "connector@example.test" }), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          })
        }

        throw new Error(`Unexpected verification request: ${url}`)
      }

      await verifyFrappeSettings(runtime.primary, adminUser, {})

      const products = await listProducts(runtime.primary)
      const checkoutProduct = products.items[0]

      assert.ok(checkoutProduct)

      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId: checkoutProduct.id, quantity: 1 }],
        fulfillmentMethod: "delivery",
        paymentMethod: "online",
        shippingAddress: {
          fullName: "Sales Order Customer",
          email: "sales-order@example.test",
          phoneNumber: "9999999999",
          line1: "12 Bazaar Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Sales Order Customer",
          email: "sales-order@example.test",
          phoneNumber: "9999999999",
          line1: "12 Bazaar Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        notes: "Deliver after quality check.",
      })

      const paidOrder = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.order.providerOrderId ?? "",
        providerPaymentId: "mock_payment_sales_order",
        signature: "mock_signature",
      })

      let salesOrderPushCount = 0
      let pushedBody: Record<string, unknown> | null = null
      globalThis.fetch = async (input, init) => {
        const url = String(input)

        if (!url.endsWith("/api/resource/Sales Order")) {
          throw new Error(`Unexpected Sales Order request: ${url}`)
        }

        salesOrderPushCount += 1
        pushedBody =
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as Record<string, unknown>)
            : null

        return new Response(JSON.stringify({ data: { name: "SAL-ORD-2026-0001" } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        })
      }

      const firstPush = await pushStorefrontOrderToFrappeSalesOrder(
        runtime.primary,
        paidOrder.item,
        { source: "manual_replay" }
      )
      const secondPush = await pushStorefrontOrderToFrappeSalesOrder(
        runtime.primary,
        paidOrder.item,
        { source: "manual_replay" }
      )
      await attachStorefrontOrderErpSalesOrderLink(
        runtime.primary,
        paidOrder.item.id,
        firstPush
      )
      const linkedOrder = await getStorefrontOrderForConnector(
        runtime.primary,
        paidOrder.item.id
      )

      assert.equal(firstPush.status, "synced")
      assert.equal(firstPush.erpSalesOrderName, "SAL-ORD-2026-0001")
      assert.equal(firstPush.storefrontOrderId, paidOrder.item.id)
      assert.equal(firstPush.itemLines.length, 1)
      assert.equal(firstPush.itemLines[0]?.itemCode.length > 0, true)
      assert.equal(salesOrderPushCount, 1)
      assert.equal(secondPush.id, firstPush.id)
      assert.equal(secondPush.erpSalesOrderName, "SAL-ORD-2026-0001")
      assert.equal(linkedOrder?.erpSalesOrderLink?.connectorSyncId, firstPush.id)
      assert.equal(linkedOrder?.erpSalesOrderLink?.salesOrderId, "SAL-ORD-2026-0001")
      assert.equal(linkedOrder?.erpSalesOrderLink?.salesOrderName, "SAL-ORD-2026-0001")
      assert.equal(linkedOrder?.erpSalesOrderLink?.status, "synced")
      assert.equal(String(pushedBody?.customer).startsWith("ECOM-"), true)
      assert.equal(pushedBody?.po_no, paidOrder.item.orderNumber)
      assert.equal(Array.isArray(pushedBody?.items), true)
    } finally {
      globalThis.fetch = originalFetch
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("frappe sales-order push policy makes approval and retry rules explicit for transactional ERP writes", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-frappe-sales-order-policy-"))

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
        apiKey: "saved-key",
        apiSecret: "saved-secret",
        timeoutSeconds: 20,
        defaultCompany: "Codexsun Trading Pvt Ltd",
        defaultWarehouse: "Main Warehouse - CS",
        defaultPriceList: "Standard Selling",
        defaultCustomerGroup: "Retail Customer",
        defaultItemGroup: "Ready Goods",
      })

      const policy = await readFrappeSalesOrderPushPolicy(runtime.primary, adminUser)

      assert.equal(policy.policy.connectorEnabled, true)
      assert.equal(policy.policy.verificationStatus, "idle")
      assert.equal(policy.policy.approvalMode, "auto_for_paid_orders")
      assert.equal(policy.policy.retryMode, "no_auto_retry")
      assert.deepEqual(policy.policy.autoPushSources, [
        "checkout_verify",
        "razorpay_webhook",
        "payment_reconcile",
      ])
      assert.match(
        policy.policy.gates.map((item) => item.rule).join(" "),
        /manual replay|must not create a second ERP Sales Order|paid state/i
      )
      assert.match(
        policy.policy.operatorRules.join(" "),
        /transport triggers only|manual replay/i
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("frappe transaction sync updates ecommerce delivery, invoice, refund links and supports replay queue for missing sales-order sync", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-frappe-transaction-sync-"))
  const originalFetch = globalThis.fetch

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const adminUser = createAdminUser()
      await saveFrappeSettings(runtime.primary, adminUser, {
        enabled: true,
        baseUrl: "https://erp.example.test",
        siteName: "codexsun",
        apiKey: "saved-key",
        apiSecret: "saved-secret",
        timeoutSeconds: 20,
        defaultCompany: "Codexsun Trading Pvt Ltd",
        defaultWarehouse: "Main Warehouse - CS",
        defaultPriceList: "Standard Selling",
        defaultCustomerGroup: "Retail Customer",
        defaultItemGroup: "Ready Goods",
      })

      globalThis.fetch = async (input) => {
        const url = String(input)

        if (url.endsWith("/api/method/frappe.auth.get_logged_user")) {
          return new Response(JSON.stringify({ message: "connector@example.test" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        }

        if (url.endsWith("/api/resource/Sales Order")) {
          return new Response(JSON.stringify({ data: { name: "SAL-ORD-2026-0002" } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        }

        throw new Error(`Unexpected request: ${url}`)
      }

      await verifyFrappeSettings(runtime.primary, adminUser, {})
      const products = await listProducts(runtime.primary)
      const checkout = await createCheckoutOrder(runtime.primary, config, {
        items: [{ productId: products.items[0]!.id, quantity: 1 }],
        fulfillmentMethod: "delivery",
        paymentMethod: "online",
        shippingAddress: {
          fullName: "Connector Sync Customer",
          email: "connector-sync@example.test",
          phoneNumber: "9999999999",
          line1: "44 Loom Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
        billingAddress: {
          fullName: "Connector Sync Customer",
          email: "connector-sync@example.test",
          phoneNumber: "9999999999",
          line1: "44 Loom Street",
          line2: null,
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        },
      })
      const paid = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.order.providerOrderId ?? "",
        providerPaymentId: "mock_payment_connector_sync",
        signature: "mock_signature",
      })

      const queueBeforeReplay = await readFrappeTransactionReconciliationQueue(
        runtime.primary,
        adminUser
      )
      const pendingSalesOrderItem = queueBeforeReplay.items.find(
        (item) => item.storefrontOrderId === paid.item.id && item.queueType === "sales_order"
      )

      assert.ok(pendingSalesOrderItem)
      assert.equal(pendingSalesOrderItem?.replayAvailable, true)

      const replay = await replayFrappeTransactionSync(runtime.primary, adminUser, {
        storefrontOrderId: paid.item.id,
        queueType: "sales_order",
      })
      const replayedOrder = await getStorefrontOrderForConnector(runtime.primary, paid.item.id)

      assert.equal(replay.replayed, true)
      assert.equal(replayedOrder?.erpSalesOrderLink?.salesOrderName, "SAL-ORD-2026-0002")

      const deliverySync = await syncFrappeDeliveryNoteToEcommerce(runtime.primary, adminUser, {
        storefrontOrderId: paid.item.id,
        deliveryNoteId: "DN-0001",
        deliveryNoteName: "DN-0001",
        shipmentReference: "SHIP-0001",
        carrierName: "Blue Dart",
        trackingId: "BD-0001",
        trackingUrl: "https://tracking.example.com/BD-0001",
        deliveryStatus: "delivered",
        note: "Delivered from ERP.",
      })
      const invoiceSync = await syncFrappeInvoiceToEcommerce(runtime.primary, adminUser, {
        storefrontOrderId: paid.item.id,
        invoiceId: "SINV-0001",
        invoiceName: "SINV-0001",
        invoiceNumber: "SINV-0001",
        invoiceStatus: "Paid",
      })
      const returnSync = await syncFrappeReturnToEcommerce(runtime.primary, adminUser, {
        storefrontOrderId: paid.item.id,
        returnId: "RET-0001",
        returnName: "RET-0001",
        creditNoteId: "CN-0001",
        creditNoteName: "CN-0001",
        returnStatus: "completed",
        refundStatus: "refunded",
        refundAmount: replayedOrder?.totalAmount ?? paid.item.totalAmount,
        currency: paid.item.currency,
        reason: "ERP processed the return and refund.",
        providerRefundId: "rfnd-erp-0001",
      })
      const finalOrder = await getStorefrontOrderForConnector(runtime.primary, paid.item.id)
      const queueAfterSync = await readFrappeTransactionReconciliationQueue(
        runtime.primary,
        adminUser
      )

      assert.equal(deliverySync.sync.deliveryNoteName, "DN-0001")
      assert.equal(invoiceSync.sync.invoiceName, "SINV-0001")
      assert.equal(returnSync.sync.returnName, "RET-0001")
      assert.equal(finalOrder?.status, "refunded")
      assert.equal(finalOrder?.paymentStatus, "refunded")
      assert.equal(finalOrder?.shipmentDetails?.trackingId, "BD-0001")
      assert.equal(finalOrder?.erpDeliveryNoteLink?.deliveryNoteName, "DN-0001")
      assert.equal(finalOrder?.erpInvoiceLink?.invoiceName, "SINV-0001")
      assert.equal(finalOrder?.erpReturnLink?.returnName, "RET-0001")
      assert.equal(finalOrder?.refund?.providerRefundId, "rfnd-erp-0001")
      assert.equal(
        queueAfterSync.items.some((item) => item.storefrontOrderId === paid.item.id),
        false
      )
    } finally {
      globalThis.fetch = originalFetch
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("frappe observability report captures connector failures and recent exceptions", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-frappe-observability-"))
  const originalFetch = globalThis.fetch

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.observability.thresholds.connectorSyncFailures = 1

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const adminUser = createAdminUser()
      await saveFrappeSettings(runtime.primary, adminUser, {
        enabled: true,
        baseUrl: "https://erp.example.test",
        siteName: "codexsun",
        apiKey: "saved-key",
        apiSecret: "saved-secret",
        timeoutSeconds: 20,
        defaultCompany: "Codexsun Trading Pvt Ltd",
        defaultWarehouse: "Main Warehouse - CS",
        defaultPriceList: "Standard Selling",
        defaultCustomerGroup: "Retail Customer",
        defaultItemGroup: "Ready Goods",
      })

      globalThis.fetch = async () => {
        throw new Error("connect ECONNREFUSED")
      }

      const verification = await verifyFrappeSettings(
        runtime.primary,
        adminUser,
        {}
      )
      const receiptSync = await syncFrappePurchaseReceipts(runtime.primary, adminUser, {
        receiptIds: ["frappe-receipt:2026-0002"],
      })
      const report = await readFrappeObservabilityReport(
        runtime.primary,
        config,
        adminUser
      )

      assert.equal(verification.verification.ok, false)
      assert.equal(receiptSync.sync.items.length, 1)
      assert.equal(report.report.summary.connectorFailureCount, 1)
      assert.equal(report.report.summary.connectorSuccessCount >= 1, true)
      assert.equal(report.report.summary.alertState, "breached")
      assert.ok(
        report.report.recentExceptions.some((item) =>
          item.action.includes("settings.verify")
        )
      )
    } finally {
      globalThis.fetch = originalFetch
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("frappe item projection contract defines the snapshot-to-core product mapping baseline", async () => {
  const adminUser = createAdminUser()
  const contract = await readFrappeItemProjectionContract(adminUser)

  assert.equal(contract.contract.sourceEntity, "frappe_item_snapshot")
  assert.equal(contract.contract.targetEntity, "core_product")
  assert.ok(
    contract.contract.identityRules.some((rule) => /item code/i.test(rule))
  )
  assert.ok(
    contract.contract.fieldMappings.some(
      (item) => item.sourceField === "itemCode" && item.targetField === "code"
    )
  )
  assert.ok(
    contract.contract.outOfScopeRules.some((rule) => /price list/i.test(rule))
  )
})

test("frappe price projection contract defines the ERP price-list to core pricing baseline", async () => {
  const adminUser = createAdminUser()
  const contract = await readFrappePriceProjectionContract(adminUser)

  assert.equal(contract.contract.sourceEntity, "frappe_item_price_snapshot")
  assert.equal(contract.contract.targetEntity, "core_product_price")
  assert.ok(
    contract.contract.identityRules.some((rule) => /price-list|price list/i.test(rule))
  )
  assert.ok(
    contract.contract.fieldMappings.some(
      (item) =>
        item.sourceField === "priceListRate" && item.targetField === "sellingPrice"
    )
  )
  assert.ok(
    contract.contract.lifecycleRules.some((rule) => /basePrice/i.test(rule))
  )
  assert.ok(
    contract.contract.outOfScopeRules.some((rule) => /coupon|promotion/i.test(rule))
  )
})

test("frappe stock projection contract defines the ERP warehouse snapshot to core stock baseline", async () => {
  const adminUser = createAdminUser()
  const contract = await readFrappeStockProjectionContract(adminUser)

  assert.equal(contract.contract.sourceEntity, "frappe_stock_snapshot")
  assert.equal(contract.contract.targetEntity, "core_product_stock")
  assert.ok(
    contract.contract.identityRules.some((rule) => /warehouse/i.test(rule))
  )
  assert.ok(
    contract.contract.fieldMappings.some(
      (item) => item.sourceField === "actualQuantity" && item.targetField === "quantity"
    )
  )
  assert.ok(
    contract.contract.lifecycleRules.some((rule) => /reservedQuantity/i.test(rule))
  )
  assert.ok(
    contract.contract.outOfScopeRules.some((rule) => /live erp stock checks/i.test(rule))
  )
})

test("frappe customer commercial profile contract defines ERP enrichment boundaries", async () => {
  const adminUser = createAdminUser()
  const contract = await readFrappeCustomerCommercialProfileContract(adminUser)

  assert.equal(
    contract.contract.sourceEntity,
    "frappe_customer_commercial_snapshot"
  )
  assert.equal(
    contract.contract.targetEntity,
    "ecommerce_customer_commercial_profile"
  )
  assert.ok(
    contract.contract.identityRules.some((rule) => /customer account|core contact/i.test(rule))
  )
  assert.ok(
    contract.contract.fieldMappings.some(
      (item) =>
        item.sourceField === "customerGroup" &&
        item.targetField === "commercialProfile.customerGroup"
    )
  )
  assert.ok(
    contract.contract.lifecycleRules.some((rule) => /coupon lifecycle|portal access/i.test(rule))
  )
  assert.ok(
    contract.contract.outOfScopeRules.some((rule) => /segmented pricing|request-time/i.test(rule))
  )
})
