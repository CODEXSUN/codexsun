import type { ClientManifest } from "../../../framework/manifests/client-manifest.js"
import type { IndustryManifest } from "../../../framework/manifests/industry-manifest.js"
import {
  auditDeskClientManifest,
  defaultClientManifest,
  studioPressClientManifest,
  techmediaClientManifest,
  theTirupurTextilesClientManifest,
  tirupurdirectClientManifest,
  upvcPrimeClientManifest,
} from "../../../../clients/index.js"
import {
  accountsAuditIndustryManifest,
  computerStoreEcommerceIndustryManifest,
  garmentEcommerceIndustryManifest,
  garmentsIndustryManifest,
  offsetIndustryManifest,
  upvcIndustryManifest,
} from "../../../../industry/index.js"
import {
  normalizeTenantIndustryId,
  tenantVisibilityAppCatalog,
  tenantVisibilityDefaultAppIds,
  tenantVisibilityDefaultModuleIds,
} from "../../shared/tenant-visibility-catalog.js"

type VisibilityRegistryRecord = {
  id: string
  displayName: string
  summary: string
  enabledAppIds: string[]
  enabledModuleIds: string[]
  featureFlags: string[]
}

const industryManifests: IndustryManifest[] = [
  garmentsIndustryManifest,
  offsetIndustryManifest,
  upvcIndustryManifest,
  garmentEcommerceIndustryManifest,
  computerStoreEcommerceIndustryManifest,
  accountsAuditIndustryManifest,
]

const clientManifests: ClientManifest[] = [
  defaultClientManifest,
  techmediaClientManifest,
  tirupurdirectClientManifest,
  theTirupurTextilesClientManifest,
  studioPressClientManifest,
  upvcPrimeClientManifest,
  auditDeskClientManifest,
]

function uniqueValues(values: string[]) {
  return [...new Set(values)]
}

function sortIds(ids: string[], order: string[]) {
  const orderMap = new Map(order.map((value, index) => [value, index] as const))

  return [...uniqueValues(ids)].sort((left, right) => {
    const leftOrder = orderMap.get(left)
    const rightOrder = orderMap.get(right)

    if (leftOrder != null || rightOrder != null) {
      if (leftOrder == null) {
        return 1
      }

      if (rightOrder == null) {
        return -1
      }

      return leftOrder - rightOrder
    }

    return left.localeCompare(right)
  })
}

export function sortTenantVisibilityAppIds(ids: string[]) {
  return sortIds(
    ids,
    tenantVisibilityAppCatalog.map((item) => item.appId)
  )
}

export function sortTenantVisibilityModuleIds(ids: string[]) {
  return sortIds(ids, tenantVisibilityDefaultModuleIds)
}

function toVisibilityRegistryRecord(
  manifest: IndustryManifest | ClientManifest
): VisibilityRegistryRecord {
  const enabledAppIds = "enabledApps" in manifest && manifest.enabledApps
    ? manifest.enabledApps
    : []
  const enabledModuleIds = "enabledModuleIds" in manifest && manifest.enabledModuleIds
    ? manifest.enabledModuleIds
    : []
  const featureFlags = "featureFlags" in manifest && manifest.featureFlags
    ? manifest.featureFlags
    : []

  return {
    id: manifest.id,
    displayName: manifest.displayName,
    summary: manifest.summary,
    enabledAppIds: sortTenantVisibilityAppIds(enabledAppIds),
    enabledModuleIds: sortTenantVisibilityModuleIds(enabledModuleIds),
    featureFlags: sortIds(featureFlags, featureFlags),
  }
}

function matchesClientOverlayIndustry(
  manifest: ClientManifest,
  industryId: string | null | undefined
) {
  const normalizedIndustryId = normalizeTenantIndustryId(industryId)

  return manifest.industryId == null || manifest.industryId === normalizedIndustryId
}

export function listTenantVisibilityBundles() {
  return industryManifests.map((manifest) => toVisibilityRegistryRecord(manifest))
}

export function getTenantVisibilityBundle(industryId: string | null | undefined) {
  const normalizedIndustryId = normalizeTenantIndustryId(industryId)

  return (
    industryManifests.find((manifest) => manifest.id === normalizedIndustryId) ??
    garmentsIndustryManifest
  )
}

export function listTenantVisibilityClientOverlays(industryId?: string | null) {
  return clientManifests
    .filter((manifest) => matchesClientOverlayIndustry(manifest, industryId))
    .map((manifest) => ({
    ...toVisibilityRegistryRecord(manifest),
    industryId: manifest.industryId ?? null,
    disabledAppIds: sortTenantVisibilityAppIds(manifest.disabledApps ?? []),
    disabledModuleIds: sortTenantVisibilityModuleIds(manifest.disabledModuleIds ?? []),
  }))
}

export function isTenantVisibilityClientOverlayCompatible(
  industryId: string | null | undefined,
  clientOverlayId: string | null | undefined
) {
  if (!clientOverlayId) {
    return true
  }

  const manifest = clientManifests.find((item) => item.id === clientOverlayId) ?? null

  if (!manifest) {
    return false
  }

  return matchesClientOverlayIndustry(manifest, industryId)
}

export function getTenantVisibilityClientOverlay(
  clientOverlayId: string | null | undefined,
  industryId?: string | null
) {
  if (clientOverlayId) {
    const manifest = clientManifests.find((item) => item.id === clientOverlayId) ?? null

    if (manifest && matchesClientOverlayIndustry(manifest, industryId)) {
      return manifest
    }
  }

  return defaultClientManifest
}

export function resolveTenantVisibilityDefaults(
  industryId: string | null | undefined,
  clientOverlayId: string | null | undefined
) {
  const bundle = getTenantVisibilityBundle(industryId)
  const clientOverlay = getTenantVisibilityClientOverlay(clientOverlayId, bundle.id)
  const appSet = new Set<string>(bundle.enabledApps ?? [])
  const moduleSet = new Set<string>(bundle.enabledModuleIds ?? [])
  const featureFlagSet = new Set<string>(bundle.featureFlags ?? [])

  for (const appId of clientOverlay.enabledApps ?? []) {
    appSet.add(appId)
  }

  for (const appId of clientOverlay.disabledApps ?? []) {
    appSet.delete(appId)
  }

  for (const moduleId of clientOverlay.enabledModuleIds ?? []) {
    moduleSet.add(moduleId)
  }

  for (const moduleId of clientOverlay.disabledModuleIds ?? []) {
    moduleSet.delete(moduleId)
  }

  for (const featureFlag of clientOverlay.featureFlags ?? []) {
    featureFlagSet.add(featureFlag)
  }

  return {
    industryId: bundle.id,
    clientOverlayId: clientOverlay.id,
    enabledAppIds:
      appSet.size > 0
        ? sortTenantVisibilityAppIds([...appSet])
        : tenantVisibilityDefaultAppIds,
    enabledModuleIds:
      moduleSet.size > 0
        ? sortTenantVisibilityModuleIds([...moduleSet])
        : tenantVisibilityDefaultModuleIds,
    featureFlags: sortIds([...featureFlagSet], [...featureFlagSet]),
  }
}
