export type InventoryAvailability = {
  tenantId: string
  warehouseId: string
  locationId: string | null
  productId: string
  variantId: string | null
  onHandQuantity: number
  reservedQuantity: number
  allocatedQuantity: number
  inTransitQuantity: number
  damagedQuantity: number
  rejectedQuantity: number
  availableQuantity: number
  lastComputedAt: string
}
