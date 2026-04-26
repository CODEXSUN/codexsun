export type InventoryWarehouseKind =
  | "distribution-center"
  | "store"
  | "dark-store"
  | "returns-hub"
  | "third-party"
  | "virtual"

export type InventoryWarehouseStatus = "draft" | "active" | "inactive" | "archived"

export type InventoryWarehouse = {
  id: string
  code: string
  name: string
  tenantId: string
  companyId: string | null
  kind: InventoryWarehouseKind
  status: InventoryWarehouseStatus
  timezone: string | null
  notes: string | null
}
