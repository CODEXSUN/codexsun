import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { listProducts } from "../../apps/core/src/services/product-service.js"
import { createBillingPurchaseReceipt } from "../../apps/billing/src/services/purchase-receipt-service.js"
import {
  acceptBillingStockUnitsToInventory,
  createBillingPurchaseReceiptBarcodeBatch,
  listBillingStockAcceptanceVerifications,
  listBillingStockUnits,
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

test("stock acceptance can reject sticker-verified units with typed rejection reasons", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-stock-acceptance-rejection-"))

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
        entryNumber: "9201",
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
            notes: "Sticker rejection test line.",
          },
        ],
      })
      const receiptLine = purchaseReceipt.item.lines[0]
      assert.ok(receiptLine)

      await createBillingPurchaseReceiptBarcodeBatch(runtime.primary, adminUser, purchaseReceipt.item.id, {
        postingDate: "2026-04-27",
        note: "Generated for sticker verification.",
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
      })

      const generatedUnits = (await listBillingStockUnits(runtime.primary, adminUser)).items.filter(
        (item) => item.purchaseReceiptId === purchaseReceipt.item.id
      )
      assert.equal(generatedUnits.length, 2)

      const response = await acceptBillingStockUnitsToInventory(runtime.primary, adminUser, {
        purchaseReceiptId: purchaseReceipt.item.id,
        productId: product.id,
        items: [
          {
            stockUnitId: generatedUnits[0]!.id,
            scannedBarcodeValue: generatedUnits[0]!.barcodeValue,
          },
          {
            stockUnitId: generatedUnits[1]!.id,
            scannedBarcodeValue: generatedUnits[1]!.barcodeValue,
            rejected: true,
            rejectionReason: "doa",
            rejectionNote: "Outer carton damaged during inward.",
          },
        ],
      })

      assert.equal(response.acceptedCount, 1)
      assert.equal(response.rejectedCount, 1)
      assert.equal(response.mismatchCount, 0)
      assert.equal(response.remainingCount, 0)
      assert.equal(response.rejectedQuantity, 1)

      const updatedUnits = (await listBillingStockUnits(runtime.primary, adminUser)).items.filter(
        (item) => item.purchaseReceiptId === purchaseReceipt.item.id
      )
      const availableUnit = updatedUnits.find((item) => item.id === generatedUnits[0]!.id)
      const rejectedUnit = updatedUnits.find((item) => item.id === generatedUnits[1]!.id)

      assert.equal(availableUnit?.status, "available")
      assert.equal(rejectedUnit?.status, "rejected")

      const rejectionRecords = (
        await listBillingStockAcceptanceVerifications(runtime.primary, adminUser, {
          purchaseReceiptId: purchaseReceipt.item.id,
          productId: product.id,
          status: "rejected",
        })
      ).items

      assert.equal(rejectionRecords.length, 1)
      assert.equal(rejectionRecords[0]?.stockUnitId, generatedUnits[1]!.id)
      assert.equal(rejectionRecords[0]?.quantityRejected, 1)
      assert.equal(rejectionRecords[0]?.rejectionReason, "doa")
      assert.equal(rejectionRecords[0]?.rejectionNote, "Outer carton damaged during inward.")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
