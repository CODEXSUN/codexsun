import { coreTableNames } from "../../../core/database/table-names.js"
import type { Product } from "../../../core/shared/index.js"
import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"
import { applyLiveStockMovement } from "../../src/services/live-stock-service.js"

export const stockLiveStockFromCoreProductsSeeder = defineDatabaseSeeder({
  id: "stock:live:01-live-stock-from-core-products",
  appId: "stock",
  moduleKey: "live-stock",
  name: "Seed live stock balances from active core product stock items",
  order: 10,
  run: async ({ database }) => {
    const products = await listJsonStorePayloads<Product>(database, coreTableNames.products)

    for (const product of products) {
      if (!product.isActive) {
        continue
      }

      for (const stockItem of product.stockItems) {
        if (!stockItem.isActive || stockItem.quantity <= 0) {
          continue
        }

        await applyLiveStockMovement(database, {
          productId: product.id,
          variantId: stockItem.variantId,
          warehouseId: stockItem.warehouseId,
          direction: "in",
          quantity: stockItem.quantity,
          referenceType: "core_product_seed",
          referenceId: stockItem.id,
          occurredAt: stockItem.updatedAt ?? product.updatedAt,
        })
      }
    }
  },
})
