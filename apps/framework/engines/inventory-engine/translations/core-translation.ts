import type { InventoryAvailability } from "../contracts/index.js"

export type CoreInventoryProjectionTarget = {
  productId: string
  variantId: string | null
  warehouseId: string
}

export type CoreInventoryProjectionItem = {
  target: CoreInventoryProjectionTarget
  availability: InventoryAvailability
}

export type CoreInventoryProjectionTranslation = {
  computedAt: string
  items: CoreInventoryProjectionItem[]
}
