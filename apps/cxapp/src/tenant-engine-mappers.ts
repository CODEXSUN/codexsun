import type { CompanySummary } from "../shared/index.js"
import type {
  TenantCompanyLink,
  TenantIndustryProfile,
  TenantRecord,
} from "../../../framework/engines/tenant-engine/contracts/index.js"

export type CxappCompanyTenantMappingOptions = {
  tenantId?: string
  tenantSlug?: string
  tenantDisplayName?: string
  industryId: string
  deploymentMode?: TenantRecord["deploymentMode"]
  enabledAppIds?: string[]
  enabledEngineIds?: string[]
  inventoryMode?: TenantIndustryProfile["inventoryMode"]
  productionPolicy?: TenantIndustryProfile["productionPolicy"]
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type CompanyTenantSource = Pick<
  CompanySummary,
  | "id"
  | "name"
  | "legalName"
  | "tagline"
  | "shortAbout"
  | "isPrimary"
  | "isActive"
  | "createdAt"
  | "updatedAt"
>

export function mapCxappCompanyToTenantRecord(
  company: CompanyTenantSource,
  options: CxappCompanyTenantMappingOptions
): TenantRecord {
  return {
    id: options.tenantId ?? `tenant:${company.id}`,
    slug: options.tenantSlug ?? normalizeSlug(company.name),
    displayName: options.tenantDisplayName ?? company.name,
    legalName: company.legalName,
    deploymentMode: options.deploymentMode ?? "production-single-tenant",
    lifecycleStatus: company.isActive ? "active" : "inactive",
    primaryCompanyId: company.id,
    defaultIndustryId: options.industryId,
    timezone: null,
    currencyCode: null,
    notes: company.shortAbout ?? company.tagline ?? null,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  }
}

export function mapCxappCompanyToTenantCompanyLink(
  company: CompanyTenantSource,
  options: CxappCompanyTenantMappingOptions
): TenantCompanyLink {
  return {
    id: `tenant-company-link:${options.tenantId ?? `tenant:${company.id}`}:${company.id}`,
    tenantId: options.tenantId ?? `tenant:${company.id}`,
    companyId: company.id,
    role: company.isPrimary ? "primary-operating-company" : "branch",
    industryId: options.industryId,
    isPrimary: company.isPrimary,
    isActive: company.isActive,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  }
}

export function mapCxappCompanyToTenantIndustryProfile(
  company: CompanyTenantSource,
  options: CxappCompanyTenantMappingOptions
): TenantIndustryProfile {
  return {
    id: `tenant-industry-profile:${options.tenantId ?? `tenant:${company.id}`}:${options.industryId}`,
    tenantId: options.tenantId ?? `tenant:${company.id}`,
    industryId: options.industryId,
    companyId: company.id,
    enabledAppIds: options.enabledAppIds ?? ["billing"],
    enabledEngineIds: options.enabledEngineIds ?? ["tenant-engine", "inventory-engine"],
    featureFlags: [],
    inventoryMode: options.inventoryMode ?? "warehouse",
    productionPolicy: options.productionPolicy ?? "single-company",
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  }
}

export function mapCxappCompanyToTenantEngineBundle(
  company: CompanyTenantSource,
  options: CxappCompanyTenantMappingOptions
) {
  const tenant = mapCxappCompanyToTenantRecord(company, options)
  const companyLink = mapCxappCompanyToTenantCompanyLink(company, {
    ...options,
    tenantId: tenant.id,
  })
  const industryProfile = mapCxappCompanyToTenantIndustryProfile(company, {
    ...options,
    tenantId: tenant.id,
  })

  return {
    tenant,
    companyLink,
    industryProfile,
  }
}
