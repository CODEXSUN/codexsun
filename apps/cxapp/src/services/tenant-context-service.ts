import type { Kysely } from "kysely"

import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { TenantContext } from "../../../framework/engines/tenant-engine/services.js"
import { createTenantEngineRuntimeServices } from "../../../framework/engines/tenant-engine/runtime-services.js"
import { normalizeTenantIndustryId } from "../../shared/tenant-visibility-catalog.js"
import { listCompanies } from "./company-service.js"
import { detectCxappIndustryId } from "./tenant-industry-detection.js"
import {
  syncCxappCompaniesToTenantEngine,
  type CompanyTenantSyncInstruction,
} from "./tenant-engine-sync-service.js"

type CompanySummary = Awaited<ReturnType<typeof listCompanies>>["items"][number]

export type ResolvedCxappTenantContext = {
  tenantId: string
  companyId: string
  industryId: string
  context: TenantContext
}

function buildSyncInstruction(company: CompanySummary): CompanyTenantSyncInstruction {
  return {
    companyId: company.id,
    industryId: detectCxappIndustryId(company),
  }
}

function getActiveCompany(
  companies: CompanySummary[],
  companyId?: string
) {
  if (companyId) {
    return companies.find((item) => item.id === companyId) ?? null
  }

  return (
    companies.find((item) => item.isPrimary) ??
    companies.find((item) => item.isActive) ??
    companies[0] ??
    null
  )
}

async function ensureTenantContextForCompany(
  database: Kysely<unknown>,
  company: CompanySummary
) {
  const runtime = createTenantEngineRuntimeServices(database)
  const existing = await runtime.contextService.resolveContext({
    companyId: company.id,
  })
  const expectedIndustryId = detectCxappIndustryId(company)
  const existingProfile =
    existing.industryProfiles.find((item) => item.companyId === company.id) ??
    existing.industryProfiles[0] ??
    null
  const hasResolvedVisibilityFields =
    existingProfile != null &&
    Array.isArray(existingProfile.enabledModuleIds) &&
    typeof existingProfile.clientOverlayId !== "undefined"
  const matchesExpectedIndustry =
    existingProfile != null &&
    normalizeTenantIndustryId(existingProfile.industryId) === expectedIndustryId

  if (
    existing.tenant &&
    existing.companyLinks.length > 0 &&
    existing.industryProfiles.length > 0 &&
    hasResolvedVisibilityFields &&
    matchesExpectedIndustry
  ) {
    return existing
  }

  await syncCxappCompaniesToTenantEngine(database, [buildSyncInstruction(company)])

  return runtime.contextService.resolveContext({
    companyId: company.id,
  })
}

export async function resolveCxappTenantContext(
  database: Kysely<unknown>,
  companyId?: string
): Promise<ResolvedCxappTenantContext> {
  const companyResponse = await listCompanies(database)
  const company = getActiveCompany(companyResponse.items, companyId)

  if (!company) {
    throw new ApplicationError("Tenant context could not be resolved because no company exists.", {}, 404)
  }

  const context = await ensureTenantContextForCompany(database, company)
  const resolvedIndustryProfile =
    context.industryProfiles.find((item) => item.companyId === company.id) ??
    context.industryProfiles[0] ??
    null

  if (!context.tenant) {
    throw new ApplicationError(
      "Tenant engine context is unavailable for the selected company.",
      { companyId: company.id },
      404
    )
  }

  if (!resolvedIndustryProfile) {
    throw new ApplicationError(
      "Tenant industry profile is unavailable for the selected company.",
      { companyId: company.id, tenantId: context.tenant.id },
      404
    )
  }

  return {
    tenantId: context.tenant.id,
    companyId: company.id,
    industryId: resolvedIndustryProfile.industryId,
    context,
  }
}
