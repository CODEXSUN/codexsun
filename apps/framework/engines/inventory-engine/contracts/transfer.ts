export type InventoryTransferStatus =
  | "draft"
  | "requested"
  | "approved"
  | "in-transit"
  | "partially-received"
  | "received"
  | "cancelled"

export type InventoryTransferLine = {
  id: string
  productId: string
  variantId: string | null
  batchId: string | null
  serialId: string | null
  quantity: number
  sourceLocationId: string | null
  destinationLocationId: string | null
}

export type InventoryStockTransfer = {
  id: string
  tenantId: string
  status: InventoryTransferStatus
  sourceWarehouseId: string
  sourceLocationId: string | null
  destinationWarehouseId: string
  destinationLocationId: string | null
  requestedAt: string
  dispatchedAt: string | null
  receivedAt: string | null
  referenceType: string | null
  referenceId: string | null
  lines: InventoryTransferLine[]
  notes: string | null
}
