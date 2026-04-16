import type {
  TenantCompanyLink,
  TenantIndustryProfile,
  TenantRecord,
} from "./contracts/index.js"

export type TenantUpsertRequest = {
  tenants: TenantRecord[]
}

export type TenantCompanyLinkUpsertRequest = {
  links: TenantCompanyLink[]
}

export type TenantIndustryProfileUpsertRequest = {
  profiles: TenantIndustryProfile[]
}

export type TenantContextResolutionRequest = {
  tenantId?: string
  companyId?: string
}

export type TenantContext = {
  tenant: TenantRecord | null
  companyLinks: TenantCompanyLink[]
  industryProfiles: TenantIndustryProfile[]
}

export interface TenantRecordServicePort {
  upsertTenants(request: TenantUpsertRequest): Promise<{ acceptedCount: number; processedAt: string }>
  listTenants(): Promise<TenantRecord[]>
}

export interface TenantCompanyLinkServicePort {
  upsertCompanyLinks(
    request: TenantCompanyLinkUpsertRequest
  ): Promise<{ acceptedCount: number; processedAt: string }>
  listCompanyLinks(): Promise<TenantCompanyLink[]>
}

export interface TenantIndustryProfileServicePort {
  upsertIndustryProfiles(
    request: TenantIndustryProfileUpsertRequest
  ): Promise<{ acceptedCount: number; processedAt: string }>
  listIndustryProfiles(): Promise<TenantIndustryProfile[]>
}

export interface TenantContextServicePort {
  resolveContext(request: TenantContextResolutionRequest): Promise<TenantContext>
}
