import {
  commonModuleKeySchema,
  commonModuleListResponseSchema,
  commonModuleMetadataListResponseSchema,
  commonModuleSummaryListResponseSchema,
  type CommonModuleKey,
  type CommonModuleListResponse,
  type CommonModuleMetadataListResponse,
  type CommonModuleSummaryListResponse,
} from "../../shared/index.js"

import { commonModuleItemsByKey, commonModuleMetadata } from "../data/core-seed.js"

export function listCommonModuleMetadata(): CommonModuleMetadataListResponse {
  return commonModuleMetadataListResponseSchema.parse({
    modules: commonModuleMetadata,
  })
}

export function listCommonModuleSummaries(): CommonModuleSummaryListResponse {
  return commonModuleSummaryListResponseSchema.parse({
    items: commonModuleMetadata.map((module) => {
      const items = commonModuleItemsByKey[module.key]
      const activeCount = items.filter((item) => item.isActive).length

      return {
        key: module.key,
        label: module.label,
        itemCount: items.length,
        activeCount,
      }
    }),
  })
}

export function listCommonModuleItems(moduleKey: string): CommonModuleListResponse {
  const parsedModuleKey = commonModuleKeySchema.parse(moduleKey) as CommonModuleKey

  return commonModuleListResponseSchema.parse({
    module: parsedModuleKey,
    items: commonModuleItemsByKey[parsedModuleKey],
  })
}
