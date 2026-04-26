import type { InventoryStockReservation } from "../contracts/index.js"

export type EcommerceInventoryReservationRequest = {
  tenantId: string
  warehouseId: string | null
  locationId: string | null
  productId: string
  variantId: string | null
  referenceType: "checkout" | "order" | "fulfilment"
  referenceId: string
  quantity: number
  expiresAt: string | null
  notes: string | null
}

export interface EcommerceInventoryAdapter {
  createReservation(
    request: EcommerceInventoryReservationRequest
  ): Promise<InventoryStockReservation>
  releaseReservation(reservationId: string, releasedAt: string): Promise<void>
}
