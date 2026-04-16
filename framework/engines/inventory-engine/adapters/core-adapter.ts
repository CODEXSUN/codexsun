import type { InventoryAvailability } from "../contracts/index.js"

export type CoreInventoryProjectionPayload = {
  items: InventoryAvailability[]
  computedAt: string
}

export interface CoreInventoryAdapter {
  projectAvailabilityToCore(payload: CoreInventoryProjectionPayload): Promise<void>
}
