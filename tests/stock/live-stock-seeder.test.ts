import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { coreTableNames } from "../../apps/core/database/table-names.js"
import { products } from "../../apps/core/src/data/product-seed.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import { replaceJsonStoreRecords } from "../../apps/framework/src/runtime/database/process/json-store.js"
import { stockTableNames } from "../../apps/stock/database/table-names.js"
import { stockLiveStockFromCoreProductsSeeder } from "../../apps/stock/database/seeder/01-live-stock-from-core-products.js"
import { getAvailableQuantityByProductIds } from "../../apps/stock/src/services/live-stock-service.js"

test("live stock seeder maps seeded core product stock items into live balances", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-live-stock-seed-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const seededProduct = products.find((item) => item.id === "core-product:aster-linen-shirt")
      assert.ok(seededProduct)

      await replaceJsonStoreRecords(runtime.primary, coreTableNames.products, [
        {
          id: seededProduct.id,
          moduleKey: "products",
          sortOrder: 1,
          payload: seededProduct,
          createdAt: seededProduct.createdAt,
          updatedAt: seededProduct.updatedAt,
        },
      ])

      await runtime.primary.deleteFrom(stockTableNames.liveBalances).execute()
      await runtime.primary.deleteFrom(stockTableNames.movementLedger).execute()

      await stockLiveStockFromCoreProductsSeeder.run({ database: runtime.primary })

      const availableQuantityByProductId = await getAvailableQuantityByProductIds(runtime.primary, [
        seededProduct.id,
      ])

      assert.equal(availableQuantityByProductId.get(seededProduct.id), 12)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
