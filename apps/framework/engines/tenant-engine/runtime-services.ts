import type { Kysely } from "kysely"

import type {
  TenantCompanyLink,
  TenantIndustryProfile,
  TenantRecord,
} from "./contracts/index.js"
import {
  listTenantEngineRecords,
  replaceTenantEngineRecords,
  tenantEngineTableNames,
} from "./runtime-store.js"
import type {
  TenantCompanyLinkServicePort,
  TenantContext,
  TenantContextResolutionRequest,
  TenantContextServicePort,
  TenantIndustryProfileServicePort,
  TenantRecordServicePort,
} from "./services.js"

function timestamp() {
  return new Date().toISOString()
}

function upsertById<T extends { id: string }>(existing: T[], incoming: T[]) {
  const incomingMap = new Map(incoming.map((item) => [item.id, item]))
  const merged = existing.map((item) => incomingMap.get(item.id) ?? item)
  const existingIds = new Set(existing.map((item) => item.id))

  for (const item of incoming) {
    if (!existingIds.has(item.id)) {
      merged.push(item)
    }
  }

  return merged
}

export function createTenantEngineRuntimeServices(database: Kysely<unknown>): {
  tenantService: TenantRecordServicePort
  companyLinkService: TenantCompanyLinkServicePort
  industryProfileService: TenantIndustryProfileServicePort
  contextService: TenantContextServicePort
} {
  const tenantService: TenantRecordServicePort = {
    async upsertTenants(request) {
      const existing = await listTenantEngineRecords<TenantRecord>(
        database,
        tenantEngineTableNames.tenants
      )
      const nextItems = upsertById(existing, request.tenants)
      const processedAt = timestamp()

      await replaceTenantEngineRecords(
        database,
        tenantEngineTableNames.tenants,
        "tenant-records",
        nextItems
      )

      return {
        acceptedCount: request.tenants.length,
        processedAt,
      }
    },
    async listTenants() {
      return listTenantEngineRecords<TenantRecord>(
        database,
        tenantEngineTableNames.tenants
      )
    },
  }

  const companyLinkService: TenantCompanyLinkServicePort = {
    async upsertCompanyLinks(request) {
      const existing = await listTenantEngineRecords<TenantCompanyLink>(
        database,
        tenantEngineTableNames.companyLinks
      )
      const nextItems = upsertById(existing, request.links)
      const processedAt = timestamp()

      await replaceTenantEngineRecords(
        database,
        tenantEngineTableNames.companyLinks,
        "tenant-company-links",
        nextItems
      )

      return {
        acceptedCount: request.links.length,
        processedAt,
      }
    },
    async listCompanyLinks() {
      return listTenantEngineRecords<TenantCompanyLink>(
        database,
        tenantEngineTableNames.companyLinks
      )
    },
  }

  const industryProfileService: TenantIndustryProfileServicePort = {
    async upsertIndustryProfiles(request) {
      const existing = await listTenantEngineRecords<TenantIndustryProfile>(
        database,
        tenantEngineTableNames.industryProfiles
      )
      const nextItems = upsertById(existing, request.profiles)
      const processedAt = timestamp()

      await replaceTenantEngineRecords(
        database,
        tenantEngineTableNames.industryProfiles,
        "tenant-industry-profiles",
        nextItems
      )

      return {
        acceptedCount: request.profiles.length,
        processedAt,
      }
    },
    async listIndustryProfiles() {
      return listTenantEngineRecords<TenantIndustryProfile>(
        database,
        tenantEngineTableNames.industryProfiles
      )
    },
  }

  const contextService: TenantContextServicePort = {
    async resolveContext(request: TenantContextResolutionRequest): Promise<TenantContext> {
      const [tenants, companyLinks, industryProfiles] = await Promise.all([
        tenantService.listTenants(),
        companyLinkService.listCompanyLinks(),
        industryProfileService.listIndustryProfiles(),
      ])

      const resolvedLink =
        request.companyId
          ? companyLinks.find((item) => item.companyId === request.companyId && item.isActive)
          : null
      const resolvedTenant =
        request.tenantId
          ? tenants.find((item) => item.id === request.tenantId) ?? null
          : resolvedLink
            ? tenants.find((item) => item.id === resolvedLink.tenantId) ?? null
            : null

      if (!resolvedTenant) {
        return {
          tenant: null,
          companyLinks: [],
          industryProfiles: [],
        }
      }

      return {
        tenant: resolvedTenant,
        companyLinks: companyLinks.filter((item) => item.tenantId === resolvedTenant.id),
        industryProfiles: industryProfiles.filter((item) => item.tenantId === resolvedTenant.id),
      }
    },
  }

  return {
    tenantService,
    companyLinkService,
    industryProfileService,
    contextService,
  }
}
