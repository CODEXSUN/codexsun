import type { EcommerceInventoryReservationRequest } from "../adapters/ecommerce-adapter.js"

export type EcommerceInventoryCheckoutLine = {
  productId: string
  variantId: string | null
  quantity: number
  warehouseId: string | null
  locationId: string | null
}

export type EcommerceInventoryReservationTranslation = {
  tenantId: string
  referenceType: "checkout" | "order" | "fulfilment"
  referenceId: string
  expiresAt: string | null
  notes: string | null
  lines: EcommerceInventoryCheckoutLine[]
  requests: EcommerceInventoryReservationRequest[]
}

export type EcommerceInventoryReleaseTranslation = {
  reservationIds: string[]
  releasedAt: string
  referenceType: "checkout" | "order" | "fulfilment"
  referenceId: string
}
