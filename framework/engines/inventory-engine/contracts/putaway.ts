export type InventoryPutawayStatus =
  | "draft"
  | "planned"
  | "in-progress"
  | "completed"
  | "cancelled"

export type InventoryPutawayLine = {
  id: string
  productId: string
  variantId: string | null
  unitId: string | null
  batchId: string | null
  serialId: string | null
  quantity: number
  inboundLocationId: string | null
  targetLocationId: string
}

export type InventoryPutawayTask = {
  id: string
  tenantId: string
  warehouseId: string
  goodsInwardReferenceId: string | null
  status: InventoryPutawayStatus
  plannedAt: string
  startedAt: string | null
  completedAt: string | null
  assignedUserId: string | null
  lines: InventoryPutawayLine[]
  notes: string | null
}
