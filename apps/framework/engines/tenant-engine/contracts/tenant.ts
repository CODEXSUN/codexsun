export type TenantDeploymentMode =
  | "development-multi-tenant"
  | "production-single-tenant"

export type TenantLifecycleStatus = "draft" | "active" | "inactive" | "archived"

export type TenantRecord = {
  id: string
  slug: string
  displayName: string
  legalName: string | null
  deploymentMode: TenantDeploymentMode
  lifecycleStatus: TenantLifecycleStatus
  primaryCompanyId: string | null
  defaultIndustryId: string | null
  timezone: string | null
  currencyCode: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}
