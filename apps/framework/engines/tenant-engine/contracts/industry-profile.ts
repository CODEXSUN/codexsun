export type TenantIndustryProfile = {
  id: string
  tenantId: string
  industryId: string
  companyId: string | null
  enabledAppIds: string[]
  enabledEngineIds: string[]
  featureFlags: string[]
  inventoryMode: "basic" | "warehouse" | "warehouse-bin" | "warehouse-bin-batch-serial"
  productionPolicy: "single-company" | "multi-company"
  createdAt: string
  updatedAt: string
}
