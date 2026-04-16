import type { Kysely } from "kysely"

import { createTenantEngineRuntimeServices } from "../../../../framework/engines/tenant-engine/runtime-services.js"
import { listCompanies } from "./company-service.js"
import { mapCxappCompanyToTenantEngineBundle } from "../tenant-engine-mappers.js"

export type CompanyTenantSyncInstruction = {
  companyId: string
  industryId: string
  tenantId?: string
  tenantSlug?: string
  tenantDisplayName?: string
}

export async function syncCxappCompaniesToTenantEngine(
  database: Kysely<unknown>,
  instructions: CompanyTenantSyncInstruction[]
) {
  const companyResponse = await listCompanies(database)
  const runtime = createTenantEngineRuntimeServices(database)
  const bundles = instructions.flatMap((instruction) => {
    const company = companyResponse.items.find((item) => item.id === instruction.companyId)

    if (!company) {
      return []
    }

    return [
      mapCxappCompanyToTenantEngineBundle(company, {
        industryId: instruction.industryId,
        tenantId: instruction.tenantId,
        tenantSlug: instruction.tenantSlug,
        tenantDisplayName: instruction.tenantDisplayName,
      }),
    ]
  })

  await Promise.all([
    runtime.tenantService.upsertTenants({
      tenants: bundles.map((item) => item.tenant),
    }),
    runtime.companyLinkService.upsertCompanyLinks({
      links: bundles.map((item) => item.companyLink),
    }),
    runtime.industryProfileService.upsertIndustryProfiles({
      profiles: bundles.map((item) => item.industryProfile),
    }),
  ])

  return {
    acceptedCount: bundles.length,
  }
}
