export type InventoryMovementDirection = "in" | "out" | "none"

export type InventoryMovementType =
  | "purchase-inward"
  | "sales-issue"
  | "sales-return"
  | "purchase-return"
  | "transfer-out"
  | "transfer-in"
  | "adjustment-increase"
  | "adjustment-decrease"
  | "reservation-hold"
  | "reservation-release"
  | "allocation"
  | "deallocation"
  | "damage"
  | "rejection"
  | "write-off"

export type InventoryStockMovement = {
  id: string
  tenantId: string
  warehouseId: string
  locationId: string | null
  productId: string
  variantId: string | null
  unitId: string | null
  batchId: string | null
  serialId: string | null
  movementType: InventoryMovementType
  direction: InventoryMovementDirection
  quantity: number
  referenceType: string | null
  referenceId: string | null
  occurredAt: string
  notes: string | null
}
