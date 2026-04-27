import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { listProducts } from "../../apps/core/src/services/product-service.js"
import {
  createBillingPurchaseReceipt,
  getBillingPurchaseReceipt,
} from "../../apps/billing/src/services/purchase-receipt-service.js"
import { listBillingGoodsInwardNotes } from "../../apps/billing/src/services/goods-inward-service.js"
import {
  createBillingPurchaseReceiptBarcodeBatch,
  listBillingStockUnits,
  rollbackBillingPurchaseReceiptBarcodes,
} from "../../apps/billing/src/services/stock-lifecycle-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

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

test("purchase receipt barcode rollback removes selected generated units and restores regeneration quantity", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-receipt-barcode-rollback-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const products = await listProducts(runtime.primary)
      const product = products.items[0]
      assert.ok(product)

      const purchaseReceipt = await createBillingPurchaseReceipt(runtime.primary, adminUser, {
        entryNumber: "PR-ROLLBACK-001",
        supplierId: "contact:supplier",
        postingDate: "2026-04-27",
        warehouseId: "warehouse:default",
        status: "open",
        lines: [
          {
            productId: product.id,
            description: product.name,
            quantity: 2,
            rate: 120,
            amount: 240,
            notes: "Rollback test line.",
          },
        ],
      })
      const receiptLine = purchaseReceipt.item.lines[0]
      assert.ok(receiptLine)

      const generatedBatch = await createBillingPurchaseReceiptBarcodeBatch(
        runtime.primary,
        adminUser,
        purchaseReceipt.item.id,
        {
          postingDate: "2026-04-27",
          note: "Initial generated batch.",
          template: "inventory-sticker-25x50mm",
          lines: [
            {
              purchaseReceiptLineId: receiptLine.id,
              inwardQuantity: 2,
              barcodeQuantity: 2,
              identityMode: "batch-and-serial",
              batchCode: "NES",
              serialPrefix: "NEX",
              barcodePrefix: product.code,
              manufacturerBarcodePrefix: "MFG",
              expiresAt: "2026-12-31",
              note: "",
            },
          ],
        }
      )

      assert.equal(generatedBatch.unitsCreated, 2)

      const generatedUnits = (await listBillingStockUnits(runtime.primary, adminUser)).items.filter(
        (item) => item.purchaseReceiptId === purchaseReceipt.item.id
      )
      assert.equal(generatedUnits.length, 2)
      assert.equal(generatedUnits[0]?.status, "received")

      const rollbackOne = await rollbackBillingPurchaseReceiptBarcodes(
        runtime.primary,
        adminUser,
        purchaseReceipt.item.id,
        {
          stockUnitIds: [generatedUnits[0]!.id],
        }
      )

      assert.equal(rollbackOne.rolledBackCount, 1)

      const unitsAfterSingleRollback = (
        await listBillingStockUnits(runtime.primary, adminUser)
      ).items.filter((item) => item.purchaseReceiptId === purchaseReceipt.item.id)
      assert.equal(unitsAfterSingleRollback.length, 1)
      assert.equal(unitsAfterSingleRollback[0]?.id, generatedUnits[1]?.id)

      const inwardAfterSingleRollback = (
        await listBillingGoodsInwardNotes(runtime.primary, adminUser)
      ).items.find((item) => item.purchaseReceiptId === purchaseReceipt.item.id)
      assert.ok(inwardAfterSingleRollback)
      assert.equal(inwardAfterSingleRollback.lines[0]?.acceptedQuantity, 1)
      assert.equal(inwardAfterSingleRollback.lines[0]?.serializationBarcodeQuantity, 1)
      assert.equal(inwardAfterSingleRollback.stockUnitIds.length, 1)

      const partiallyRolledBackReceipt = await getBillingPurchaseReceipt(
        runtime.primary,
        adminUser,
        purchaseReceipt.item.id
      )
      assert.equal(partiallyRolledBackReceipt.item.status, "partially_received")

      const rollbackRest = await rollbackBillingPurchaseReceiptBarcodes(
        runtime.primary,
        adminUser,
        purchaseReceipt.item.id,
        {
          stockUnitIds: unitsAfterSingleRollback.map((item) => item.id),
        }
      )

      assert.equal(rollbackRest.rolledBackCount, 1)

      const unitsAfterFullRollback = (
        await listBillingStockUnits(runtime.primary, adminUser)
      ).items.filter((item) => item.purchaseReceiptId === purchaseReceipt.item.id)
      assert.equal(unitsAfterFullRollback.length, 0)

      const inwardsAfterFullRollback = (
        await listBillingGoodsInwardNotes(runtime.primary, adminUser)
      ).items.filter((item) => item.purchaseReceiptId === purchaseReceipt.item.id)
      assert.equal(inwardsAfterFullRollback.length, 0)

      const reopenedReceipt = await getBillingPurchaseReceipt(
        runtime.primary,
        adminUser,
        purchaseReceipt.item.id
      )
      assert.equal(reopenedReceipt.item.status, "open")

      const regeneratedBatch = await createBillingPurchaseReceiptBarcodeBatch(
        runtime.primary,
        adminUser,
        purchaseReceipt.item.id,
        {
          postingDate: "2026-04-27",
          note: "Regenerated after rollback.",
          template: "inventory-sticker-25x50mm",
          lines: [
            {
              purchaseReceiptLineId: receiptLine.id,
              inwardQuantity: 1,
              barcodeQuantity: 1,
              identityMode: "batch-and-serial",
              batchCode: "NES",
              serialPrefix: "NEX",
              barcodePrefix: product.code,
              manufacturerBarcodePrefix: "MFG",
              expiresAt: "2026-12-31",
              note: "",
            },
          ],
        }
      )

      assert.equal(regeneratedBatch.unitsCreated, 1)
      assert.equal(
        regeneratedBatch.stickerBatch.items[0]?.barcodeValue,
        `${product.code}NESNEX01`
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
