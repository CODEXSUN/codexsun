export type InventoryReservationStatus =
  | "draft"
  | "active"
  | "allocated"
  | "partially-consumed"
  | "consumed"
  | "released"
  | "expired"
  | "cancelled"

export type InventoryStockReservation = {
  id: string
  tenantId: string
  warehouseId: string | null
  locationId: string | null
  productId: string
  variantId: string | null
  referenceType: string
  referenceId: string
  quantity: number
  consumedQuantity: number
  status: InventoryReservationStatus
  reservedAt: string
  expiresAt: string | null
  releasedAt: string | null
  notes: string | null
}
