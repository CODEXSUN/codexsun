export type InventoryTopologyMode =
  | "warehouse-only"
  | "zone-aware"
  | "rack-aware"
  | "bin-aware"

export type InventoryPutawayStrategy =
  | "manual"
  | "fixed-bin"
  | "nearest-available"
  | "capacity-aware"
  | "fifo-zone"
  | "fefo-zone"

export type InventoryPickingStrategy =
  | "manual"
  | "fifo"
  | "fefo"
  | "lowest-level-first"
  | "fixed-bin-first"

export type InventoryWarehouseTopology = {
  warehouseId: string
  mode: InventoryTopologyMode
  putawayStrategy: InventoryPutawayStrategy
  pickingStrategy: InventoryPickingStrategy
  allowsMixedSkuBins: boolean
  allowsNegativeStock: boolean
  usesStagingLocations: boolean
  usesReturnLocations: boolean
  usesDamageLocations: boolean
}
