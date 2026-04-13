import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createBillingPurchaseReceipt,
  getBillingPurchaseReceipt,
  updateBillingPurchaseReceipt,
} from "../../apps/billing/src/services/purchase-receipt-service.js"
import {
  createBillingGoodsInwardNote,
  getBillingGoodsInwardNote,
  updateBillingGoodsInwardNote,
} from "../../apps/billing/src/services/goods-inward-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import { listProducts } from "../../apps/core/src/services/product-service.js"

const adminUser = {
  id: "auth-user:platform-admin",
  email: "sundar@sundar.com",
  phoneNumber: "9999999999",
  displayName: "Sundar",
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

test("billing stock foundation creates purchase receipt and goods inward without posting stock into core", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-stock-foundation-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const productsBefore = await listProducts(runtime.primary)
      const product = productsBefore.items[0]
      assert.ok(product)

      const purchaseReceipt = await createBillingPurchaseReceipt(
        runtime.primary,
        adminUser,
        {
          receiptNumber: "PR-2026-001",
          supplierName: "Foundry Supplier",
          supplierLedgerId: "ledger-sundry-creditors",
          postingDate: "2026-04-13",
          warehouseId: "warehouse:default",
          warehouseName: "Default Warehouse",
          sourceVoucherId: null,
          sourceFrappeReceiptId: null,
          status: "open",
          note: "Initial local purchase receipt.",
          lines: [
            {
              productId: product.id,
              productName: product.name,
              variantId: null,
              variantName: null,
              warehouseId: "warehouse:default",
              quantity: 3,
              unit: "Nos",
              unitCost: 1200,
              note: "Expected inward quantity.",
            },
          ],
        }
      )

      assert.equal(purchaseReceipt.item.status, "open")
      assert.equal(purchaseReceipt.item.lines[0]?.receivedQuantity, 0)

      const storedPurchaseReceipt = await getBillingPurchaseReceipt(
        runtime.primary,
        adminUser,
        purchaseReceipt.item.id
      )
      assert.equal(storedPurchaseReceipt.item.receiptNumber, "PR-2026-001")

      const goodsInward = await createBillingGoodsInwardNote(
        runtime.primary,
        adminUser,
        {
          inwardNumber: "GIN-2026-001",
          purchaseReceiptId: purchaseReceipt.item.id,
          purchaseReceiptNumber: purchaseReceipt.item.receiptNumber,
          supplierName: purchaseReceipt.item.supplierName,
          postingDate: "2026-04-13",
          warehouseId: purchaseReceipt.item.warehouseId,
          warehouseName: purchaseReceipt.item.warehouseName,
          status: "verified",
          note: "Goods verified but not yet posted to sellable stock.",
          lines: [
            {
              purchaseReceiptLineId: purchaseReceipt.item.lines[0]!.id,
              productId: product.id,
              productName: product.name,
              variantId: null,
              variantName: null,
              expectedQuantity: 3,
              acceptedQuantity: 3,
              rejectedQuantity: 0,
              damagedQuantity: 0,
              manufacturerBarcode: "MFG-BC-001",
              manufacturerSerial: "MFG-SR-001",
              note: "All units accepted.",
            },
          ],
        }
      )

      assert.equal(goodsInward.item.status, "verified")
      assert.equal(goodsInward.item.stockPostingStatus, "blocked_until_verification")

      const storedGoodsInward = await getBillingGoodsInwardNote(
        runtime.primary,
        adminUser,
        goodsInward.item.id
      )
      assert.equal(storedGoodsInward.item.inwardNumber, "GIN-2026-001")

      const updatedGoodsInward = await updateBillingGoodsInwardNote(
        runtime.primary,
        adminUser,
        goodsInward.item.id,
        {
          inwardNumber: "GIN-2026-001",
          purchaseReceiptId: purchaseReceipt.item.id,
          purchaseReceiptNumber: purchaseReceipt.item.receiptNumber,
          supplierName: purchaseReceipt.item.supplierName,
          postingDate: "2026-04-13",
          warehouseId: purchaseReceipt.item.warehouseId,
          warehouseName: purchaseReceipt.item.warehouseName,
          status: "pending_verification",
          note: "Moved back for inward review.",
          lines: [
            {
              purchaseReceiptLineId: purchaseReceipt.item.lines[0]!.id,
              productId: product.id,
              productName: product.name,
              variantId: null,
              variantName: null,
              expectedQuantity: 3,
              acceptedQuantity: 2,
              rejectedQuantity: 1,
              damagedQuantity: 0,
              manufacturerBarcode: "MFG-BC-001",
              manufacturerSerial: "MFG-SR-001",
              note: "One unit held back.",
            },
          ],
        }
      )

      assert.equal(updatedGoodsInward.item.stockPostingStatus, "not_posted")
      assert.equal(updatedGoodsInward.item.lines[0]?.acceptedQuantity, 2)

      const updatedPurchaseReceipt = await updateBillingPurchaseReceipt(
        runtime.primary,
        adminUser,
        purchaseReceipt.item.id,
        {
          receiptNumber: "PR-2026-001",
          supplierName: "Foundry Supplier",
          supplierLedgerId: "ledger-sundry-creditors",
          postingDate: "2026-04-13",
          warehouseId: "warehouse:default",
          warehouseName: "Default Warehouse",
          sourceVoucherId: null,
          sourceFrappeReceiptId: null,
          status: "partially_received",
          note: "Receiving progress captured locally.",
          lines: [
            {
              productId: product.id,
              productName: product.name,
              variantId: null,
              variantName: null,
              warehouseId: "warehouse:default",
              quantity: 3,
              unit: "Nos",
              unitCost: 1200,
              note: "Expected inward quantity.",
            },
          ],
        }
      )

      assert.equal(updatedPurchaseReceipt.item.status, "partially_received")

      const productsAfter = await listProducts(runtime.primary)
      const productAfter = productsAfter.items.find((item) => item.id === product.id)

      assert.equal(productAfter?.totalStockQuantity, product.totalStockQuantity)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
