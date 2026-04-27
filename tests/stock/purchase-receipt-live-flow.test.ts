import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import test from "node:test"

const workspaceRoot = process.cwd()

function readWorkspaceFile(filePath: string) {
  return readFileSync(path.join(workspaceRoot, filePath), "utf8")
}

test("purchase receipt stock entry flow is wired through acceptance into live stock ledger", () => {
  const stockRoutes = readWorkspaceFile("apps/api/src/internal/stock-routes.ts")
  const stockManager = readWorkspaceFile("apps/stock/src/services/stock-manager-service.ts")
  const billingStockLifecycle = readWorkspaceFile(
    "apps/billing/src/services/stock-lifecycle-service.ts"
  )
  const liveStockService = readWorkspaceFile("apps/stock/src/services/live-stock-service.ts")
  const storefrontProjectionService = readWorkspaceFile(
    "apps/ecommerce/src/services/projected-product-service.ts"
  )
  const storefrontOrderService = readWorkspaceFile("apps/ecommerce/src/services/order-service.ts")
  const stockSeederIndex = readWorkspaceFile("apps/stock/database/seeder/index.ts")
  const stockEntryUi = readWorkspaceFile(
    "apps/stock/web/src/workspace/stock-workspace-support-sections.tsx"
  )

  assert.match(stockRoutes, /\/stock\/purchase-receipt\/barcodes/)
  assert.match(stockRoutes, /\/stock\/stock-acceptance/)
  assert.match(stockRoutes, /\/stock\/movements/)
  assert.match(stockRoutes, /\/stock\/availability/)

  assert.match(stockManager, /createStockPurchaseReceiptBarcodeBatch/)
  assert.match(stockManager, /rollbackStockPurchaseReceiptBarcodes/)
  assert.match(stockManager, /acceptStockUnitsToInventory/)
  assert.match(stockManager, /listStockMovements/)
  assert.match(stockManager, /listStockAvailability/)

  assert.match(billingStockLifecycle, /createBillingPurchaseReceiptBarcodeBatch/)
  assert.match(billingStockLifecycle, /rollbackBillingPurchaseReceiptBarcodes/)
  assert.match(billingStockLifecycle, /const sequenceToken = String\(unitSequence\)\.padStart\(2,\s*"0"\)/)
  assert.match(billingStockLifecycle, /`\$\{serialPrefix\}\$\{sequenceToken\}`/)
  assert.match(billingStockLifecycle, /`\$\{manufacturerBarcodePrefix\}\$\{sequenceToken\}`/)
  assert.match(
    billingStockLifecycle,
    /return `\$\{normalizedPrefix\}\$\{normalizedBatchCode\}\$\{normalizedSerialNumber\}`/
  )
  assert.match(billingStockLifecycle, /status:\s*"received"/)
  assert.match(
    billingStockLifecycle,
    /Barcode verification and acceptance are still required before inventory becomes live|billing_stock_acceptance/
  )
  assert.match(billingStockLifecycle, /acceptBillingStockUnitsToInventory/)
  assert.match(billingStockLifecycle, /status:\s*"available"/)
  assert.match(billingStockLifecycle, /status:\s*"rejected"/)
  assert.match(billingStockLifecycle, /rejectionReason/)
  assert.match(billingStockLifecycle, /rejectionNote/)
  assert.match(billingStockLifecycle, /applyLiveStockMovement\(database,\s*{\s*productId:\s*unit\.productId/s)
  assert.match(billingStockLifecycle, /referenceType:\s*"billing_stock_acceptance"/)

  assert.match(liveStockService, /stockTableNames\.liveBalances/)
  assert.match(liveStockService, /stockTableNames\.movementLedger/)
  assert.match(liveStockService, /available_quantity/)
  assert.match(liveStockService, /balanceQuantity\s*-\s*current\.reserved_quantity/)

  assert.equal(
    existsSync(path.join(workspaceRoot, "apps/stock/database/seeder/01-live-stock-from-core-products.ts")),
    false
  )
  assert.doesNotMatch(stockSeederIndex, /core-products|core_product_seed|stockItems/)
  assert.doesNotMatch(storefrontProjectionService, /stockItems|stockQuantity/)
  assert.match(storefrontOrderService, /listLiveStockBalances/)
  assert.doesNotMatch(storefrontOrderService, /product\.stockItems/)

  assert.match(stockEntryUi, /Confirm partial stock acceptance/)
  assert.match(stockEntryUi, /Rejected Records/)
  assert.match(stockEntryUi, /Goods Rejections/)
  assert.match(stockEntryUi, /Rejection type/)
  assert.match(stockEntryUi, /DOA|doa/)
  assert.match(stockEntryUi, /\/internal\/v1\/stock\/stock-acceptance/)
  assert.match(
    stockEntryUi,
    /Barcode verification and acceptance are still required before inventory becomes live/
  )
})
