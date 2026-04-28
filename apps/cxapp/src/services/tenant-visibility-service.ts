import type { Kysely } from "kysely"

import type { TenantIndustryProfile, TenantRecord } from "../../../framework/engines/tenant-engine/contracts/index.js"
import { createTenantEngineRuntimeServices } from "../../../framework/engines/tenant-engine/runtime-services.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  tenantVisibilityAdminSnapshotResponseSchema,
  tenantVisibilityCurrentSchema,
  tenantVisibilityProfileUpdatePayloadSchema,
  tenantVisibilityProfileUpdateResponseSchema,
  type TenantVisibilityCurrent,
} from "../../shared/index.js"
import { tenantVisibilityAppCatalog } from "../../shared/index.js"
import { listCompanies } from "./company-service.js"
import { detectCxappIndustryId } from "./tenant-industry-detection.js"
import { syncCxappCompaniesToTenantEngine } from "./tenant-engine-sync-service.js"
import {
  listTenantVisibilityBundles,
  listTenantVisibilityClientOverlays,
  resolveTenantVisibilityDefaults,
  sortTenantVisibilityAppIds,
  sortTenantVisibilityModuleIds,
} from "./tenant-visibility-registry.js"

type CompanySummary = Awaited<ReturnType<typeof listCompanies>>["items"][number]
type TenantContextRecord = {
  tenant: TenantRecord
  profile: TenantIndustryProfile
}

function createDefaultCurrentVisibility(): TenantVisibilityCurrent {
  const defaults = resolveTenantVisibilityDefaults("garments", "default")

  return tenantVisibilityCurrentSchema.parse({
    tenantId: null,
    companyId: null,
    industryId: defaults.industryId,
    clientOverlayId: defaults.clientOverlayId,
    visibleAppIds: defaults.enabledAppIds,
    visibleModuleIds: defaults.enabledModuleIds,
  })
}

function createProfileRecord(
  company: CompanySummary,
  tenant: TenantRecord,
  existing: TenantIndustryProfile | null,
  overrides: {
    industryId?: string | null
    clientOverlayId?: string | null
    enabledAppIds?: string[]
    enabledModuleIds?: string[]
    featureFlags?: string[]
    inventoryMode?: TenantIndustryProfile["inventoryMode"]
    productionPolicy?: TenantIndustryProfile["productionPolicy"]
  } = {}
): TenantIndustryProfile {
  const defaults = resolveTenantVisibilityDefaults(
    overrides.industryId ?? existing?.industryId ?? tenant.defaultIndustryId ?? detectCxappIndustryId(company),
    overrides.clientOverlayId ?? existing?.clientOverlayId ?? "default"
  )
  const timestamp = new Date().toISOString()

  return {
    id: existing?.id ?? `tenant-industry-profile:${tenant.id}:${defaults.industryId}`,
    tenantId: tenant.id,
    companyId: company.id,
    industryId: defaults.industryId,
    clientOverlayId: defaults.clientOverlayId,
    enabledAppIds: sortTenantVisibilityAppIds(
      overrides.enabledAppIds ?? existing?.enabledAppIds ?? defaults.enabledAppIds
    ),
    enabledModuleIds: sortTenantVisibilityModuleIds(
      overrides.enabledModuleIds ?? existing?.enabledModuleIds ?? defaults.enabledModuleIds
    ),
    enabledEngineIds: existing?.enabledEngineIds ?? ["tenant-engine", "inventory-engine"],
    featureFlags: [...new Set(overrides.featureFlags ?? existing?.featureFlags ?? defaults.featureFlags)].sort(),
    inventoryMode: overrides.inventoryMode ?? existing?.inventoryMode ?? "warehouse",
    productionPolicy: overrides.productionPolicy ?? existing?.productionPolicy ?? "single-company",
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

async function ensureTenantProfiles(database: Kysely<unknown>, companies: CompanySummary[]) {
  if (companies.length === 0) {
    return
  }

  await syncCxappCompaniesToTenantEngine(
    database,
    companies.map((company) => ({
      companyId: company.id,
      industryId: detectCxappIndustryId(company),
    }))
  )
}

async function loadTenantContextRecords(database: Kysely<unknown>) {
  const runtime = createTenantEngineRuntimeServices(database)
  const [tenants, companyLinks, industryProfiles] = await Promise.all([
    runtime.tenantService.listTenants(),
    runtime.companyLinkService.listCompanyLinks(),
    runtime.industryProfileService.listIndustryProfiles(),
  ])

  return {
    tenants,
    companyLinks,
    industryProfiles,
  }
}

function resolveTenantForCompany(
  company: CompanySummary,
  context: Awaited<ReturnType<typeof loadTenantContextRecords>>
): TenantContextRecord | null {
  const companyLink = context.companyLinks.find((item) => item.companyId === company.id && item.isActive)
  const tenant =
    companyLink
      ? context.tenants.find((item) => item.id === companyLink.tenantId) ?? null
      : null

  if (!tenant) {
    return null
  }

  const profile =
    context.industryProfiles.find((item) => item.companyId === company.id) ??
    context.industryProfiles.find((item) => item.tenantId === tenant.id) ??
    null

  if (!profile) {
    return null
  }

  return {
    tenant,
    profile,
  }
}

function toTenantVisibilityItem(
  company: CompanySummary,
  record: TenantContextRecord
) {
  const normalizedProfile = createProfileRecord(company, record.tenant, record.profile)

  return tenantVisibilityProfileUpdateResponseSchema.shape.item.parse({
    tenantId: record.tenant.id,
    tenantSlug: record.tenant.slug,
    tenantDisplayName: record.tenant.displayName,
    companyId: company.id,
    companyName: company.name,
    isPrimaryCompany: company.isPrimary,
    isActiveCompany: company.isActive,
    industryId: normalizedProfile.industryId,
    clientOverlayId: normalizedProfile.clientOverlayId,
    enabledAppIds: normalizedProfile.enabledAppIds,
    enabledModuleIds: normalizedProfile.enabledModuleIds,
    featureFlags: normalizedProfile.featureFlags,
    inventoryMode: normalizedProfile.inventoryMode,
    productionPolicy: normalizedProfile.productionPolicy,
  })
}

export async function getCurrentTenantVisibility(
  database: Kysely<unknown>
): Promise<TenantVisibilityCurrent> {
  const companies = (await listCompanies(database)).items
  const primaryCompany =
    companies.find((company) => company.isPrimary) ??
    companies.find((company) => company.isActive) ??
    companies[0] ??
    null

  if (!primaryCompany) {
    return createDefaultCurrentVisibility()
  }

  await ensureTenantProfiles(database, [primaryCompany])
  const context = await loadTenantContextRecords(database)
  const record = resolveTenantForCompany(primaryCompany, context)

  if (!record) {
    return createDefaultCurrentVisibility()
  }

  const normalizedProfile = createProfileRecord(primaryCompany, record.tenant, record.profile)

  return tenantVisibilityCurrentSchema.parse({
    tenantId: record.tenant.id,
    companyId: primaryCompany.id,
    industryId: normalizedProfile.industryId,
    clientOverlayId: normalizedProfile.clientOverlayId,
    visibleAppIds: normalizedProfile.enabledAppIds,
    visibleModuleIds: normalizedProfile.enabledModuleIds,
  })
}

export async function getTenantVisibilityAdminSnapshot(database: Kysely<unknown>) {
  const companies = (await listCompanies(database)).items
  await ensureTenantProfiles(database, companies)

  const context = await loadTenantContextRecords(database)
  const items = companies.flatMap((company) => {
    const record = resolveTenantForCompany(company, context)

    return record ? [toTenantVisibilityItem(company, record)] : []
  })

  return tenantVisibilityAdminSnapshotResponseSchema.parse({
    item: {
      bundles: listTenantVisibilityBundles(),
      clientOverlays: listTenantVisibilityClientOverlays(),
      apps: tenantVisibilityAppCatalog,
      items,
      current: await getCurrentTenantVisibility(database),
    },
  })
}

export async function updateTenantVisibilityProfile(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsedPayload = tenantVisibilityProfileUpdatePayloadSchema.parse(payload)
  const companies = (await listCompanies(database)).items
  const company = companies.find((item) => item.id === parsedPayload.companyId) ?? null

  if (!company) {
    throw new ApplicationError("Company could not be found.", { companyId: parsedPayload.companyId }, 404)
  }

  await ensureTenantProfiles(database, [company])

  const runtime = createTenantEngineRuntimeServices(database)
  const context = await loadTenantContextRecords(database)
  const record = resolveTenantForCompany(company, context)

  if (!record) {
    throw new ApplicationError(
      "Tenant profile could not be resolved for the selected company.",
      { companyId: company.id },
      404
    )
  }

  const nextProfile = createProfileRecord(company, record.tenant, record.profile, {
    industryId: parsedPayload.industryId,
    clientOverlayId: parsedPayload.clientOverlayId ?? "default",
    enabledAppIds: parsedPayload.enabledAppIds,
    enabledModuleIds: parsedPayload.enabledModuleIds,
    featureFlags: parsedPayload.featureFlags,
    inventoryMode: parsedPayload.inventoryMode,
    productionPolicy: parsedPayload.productionPolicy,
  })

  await runtime.industryProfileService.upsertIndustryProfiles({
    profiles: [nextProfile],
  })

  return tenantVisibilityProfileUpdateResponseSchema.parse({
    item: {
      tenantId: record.tenant.id,
      tenantSlug: record.tenant.slug,
      tenantDisplayName: record.tenant.displayName,
      companyId: company.id,
      companyName: company.name,
      isPrimaryCompany: company.isPrimary,
      isActiveCompany: company.isActive,
      industryId: nextProfile.industryId,
      clientOverlayId: nextProfile.clientOverlayId,
      enabledAppIds: nextProfile.enabledAppIds,
      enabledModuleIds: nextProfile.enabledModuleIds,
      featureFlags: nextProfile.featureFlags,
      inventoryMode: nextProfile.inventoryMode,
      productionPolicy: nextProfile.productionPolicy,
    },
  })
}
