export type TenantCompanyRole =
  | "primary-operating-company"
  | "legal-entity"
  | "branch"
  | "warehouse-operator"
  | "shared-service"

export type TenantCompanyLink = {
  id: string
  tenantId: string
  companyId: string
  role: TenantCompanyRole
  industryId: string | null
  isPrimary: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}
