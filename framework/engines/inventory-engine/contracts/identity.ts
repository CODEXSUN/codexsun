export type InventoryIdentityMode =
  | "none"
  | "batch"
  | "serial"
  | "batch-and-serial"

export type InventoryBarcodeKind =
  | "internal"
  | "manufacturer"
  | "vendor"
  | "hybrid"

export type InventoryBarcodeRecord = {
  id: string
  tenantId: string
  stockUnitId: string | null
  batchId: string | null
  serialId: string | null
  value: string
  kind: InventoryBarcodeKind
  isPrimary: boolean
  isActive: boolean
  issuedAt: string
}

export type InventoryBatchRecord = {
  id: string
  tenantId: string
  warehouseId: string
  locationId: string | null
  productId: string
  variantId: string | null
  batchCode: string
  sourceVendorCode: string | null
  manufacturingDate: string | null
  expiryDate: string | null
  quantity: number
  status: "draft" | "active" | "consumed" | "expired" | "archived"
}

export type InventorySerialRecord = {
  id: string
  tenantId: string
  warehouseId: string
  locationId: string | null
  productId: string
  variantId: string | null
  serialNumber: string
  batchId: string | null
  barcodeId: string | null
  status: "received" | "available" | "allocated" | "issued" | "returned" | "archived"
}

export type InventoryStockUnitIdentity = {
  id: string
  tenantId: string
  warehouseId: string
  locationId: string | null
  productId: string
  variantId: string | null
  identityMode: InventoryIdentityMode
  batchId: string | null
  serialId: string | null
  barcodeId: string | null
  quantity: number
  status: "received" | "available" | "allocated" | "issued" | "damaged" | "rejected" | "archived"
}
