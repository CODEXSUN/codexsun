export type InventoryNumberTarget =
  | "warehouse"
  | "location"
  | "stock-unit"
  | "batch"
  | "serial"
  | "barcode"

export type InventoryNumberToken =
  | "tenant-code"
  | "company-code"
  | "warehouse-code"
  | "vendor-code"
  | "product-code"
  | "variant-code"
  | "date-yyyymmdd"
  | "sequence"
  | "literal"

export type InventoryNumberSegment = {
  token: InventoryNumberToken
  value?: string
  width?: number
  separator?: string
}

export type InventoryNumberRule = {
  id: string
  tenantId: string
  target: InventoryNumberTarget
  name: string
  description: string | null
  resetPolicy: "never" | "daily" | "monthly" | "yearly"
  sequencePadding: number
  prefix: string | null
  suffix: string | null
  segments: InventoryNumberSegment[]
  isActive: boolean
}

export type InventoryNumberPreview = {
  target: InventoryNumberTarget
  sampleValue: string
  appliedRuleId: string | null
}
