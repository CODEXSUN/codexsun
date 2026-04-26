import type { InventoryBarcodeKind, InventoryIdentityMode } from "./identity.js"

export type InventoryIdentityGenerationMode =
  | "manual"
  | "generated"
  | "hybrid"

export type InventoryNumberScope =
  | "tenant"
  | "company"
  | "warehouse"
  | "product"
  | "variant"
  | "vendor"

export type InventoryIdentityPolicy = {
  tenantId: string
  productId: string
  variantId: string | null
  identityMode: InventoryIdentityMode
  barcodeKind: InventoryBarcodeKind
  barcodeGenerationMode: InventoryIdentityGenerationMode
  batchGenerationMode: InventoryIdentityGenerationMode
  serialGenerationMode: InventoryIdentityGenerationMode
  allowsVendorBarcodeAsPrimary: boolean
  allowsManufacturerBarcodeAsPrimary: boolean
  requiresBatchForReceiving: boolean
  requiresSerialForReceiving: boolean
  requiresExpiryTracking: boolean
  numberingScope: InventoryNumberScope
}
