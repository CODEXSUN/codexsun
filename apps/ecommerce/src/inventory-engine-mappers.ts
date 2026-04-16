import type {
  EcommerceInventoryReleaseTranslation,
  EcommerceInventoryReservationTranslation,
} from "../../../framework/engines/inventory-engine/translations/index.js"
import type { EcommerceInventoryReservationRequest } from "../../../framework/engines/inventory-engine/adapters/index.js"

export type EcommerceReservationLineInput = {
  productId: string
  variantId: string | null
  quantity: number
  warehouseId: string | null
  locationId: string | null
}

export function mapCheckoutToInventoryReservationTranslation(input: {
  tenantId: string
  referenceType: "checkout" | "order" | "fulfilment"
  referenceId: string
  expiresAt: string | null
  notes: string | null
  lines: EcommerceReservationLineInput[]
}): EcommerceInventoryReservationTranslation {
  const requests: EcommerceInventoryReservationRequest[] = input.lines.map((line, index) => ({
    tenantId: input.tenantId,
    warehouseId: line.warehouseId,
    locationId: line.locationId,
    productId: line.productId,
    variantId: line.variantId,
    referenceType: input.referenceType,
    referenceId: `${input.referenceId}:${index + 1}`,
    quantity: line.quantity,
    expiresAt: input.expiresAt,
    notes: input.notes,
  }))

  return {
    tenantId: input.tenantId,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    expiresAt: input.expiresAt,
    notes: input.notes,
    lines: input.lines,
    requests,
  }
}

export function mapReservationIdsToReleaseTranslation(input: {
  reservationIds: string[]
  releasedAt: string
  referenceType: "checkout" | "order" | "fulfilment"
  referenceId: string
}): EcommerceInventoryReleaseTranslation {
  return {
    reservationIds: input.reservationIds,
    releasedAt: input.releasedAt,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
  }
}
