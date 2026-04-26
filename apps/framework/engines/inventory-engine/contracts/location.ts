export type InventoryLocationKind =
  | "warehouse"
  | "zone"
  | "aisle"
  | "rack"
  | "shelf"
  | "bin"
  | "staging"
  | "returns"
  | "damaged"
  | "virtual"

export type InventoryLocationStatus = "draft" | "active" | "inactive" | "blocked"

export type InventoryWarehouseLocation = {
  id: string
  warehouseId: string
  parentLocationId: string | null
  code: string
  name: string
  kind: InventoryLocationKind
  status: InventoryLocationStatus
  level: number
  path: string
  allowsPutaway: boolean
  allowsPicking: boolean
  allowsSaleableStock: boolean
  notes: string | null
}
