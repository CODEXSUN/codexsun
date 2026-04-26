import type { InventoryAvailability } from "../../framework/engines/inventory-engine/contracts/index.js"
import type {
  CoreInventoryProjectionTranslation,
} from "../../framework/engines/inventory-engine/translations/index.js"

export type CoreProjectedStockItem = {
  productId: string
  variantId: string | null
  warehouseId: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
}

export function mapInventoryAvailabilityToCoreProjectedStock(
  payload: CoreInventoryProjectionTranslation
): CoreProjectedStockItem[] {
  return payload.items.map(({ target, availability }) => ({
    productId: target.productId,
    variantId: target.variantId,
    warehouseId: target.warehouseId,
    quantity: availability.onHandQuantity,
    reservedQuantity: availability.reservedQuantity,
    availableQuantity: availability.availableQuantity,
  }))
}

export function buildCoreInventoryProjectionTranslation(
  computedAt: string,
  items: InventoryAvailability[]
): CoreInventoryProjectionTranslation {
  return {
    computedAt,
    items: items.map((availability) => ({
      target: {
        productId: availability.productId,
        variantId: availability.variantId,
        warehouseId: availability.warehouseId,
      },
      availability,
    })),
  }
}
