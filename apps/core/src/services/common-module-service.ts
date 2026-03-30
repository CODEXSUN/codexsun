import type { Kysely } from "kysely"

import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import {
  commonModuleItemSchema,
  commonModuleKeySchema,
  commonModuleListResponseSchema,
  commonModuleMetadataListResponseSchema,
  commonModuleSummaryListResponseSchema,
  type CommonModuleItem,
  type CommonModuleKey,
  type CommonModuleListResponse,
  type CommonModuleMetadata,
  type CommonModuleMetadataListResponse,
  type CommonModuleSummaryListResponse,
} from "../../shared/index.js"

import { coreTableNames } from "../../database/table-names.js"

async function getCommonModuleMetadata(
  database: Kysely<unknown>
): Promise<CommonModuleMetadata[]> {
  return listJsonStorePayloads<CommonModuleMetadata>(
    database,
    coreTableNames.commonModuleMetadata
  )
}

async function getCommonModuleItems(
  database: Kysely<unknown>,
  moduleKey: CommonModuleKey
): Promise<CommonModuleItem[]> {
  const items = await listJsonStorePayloads<CommonModuleItem>(
    database,
    coreTableNames.commonModuleItems,
    moduleKey
  )

  return items.map((item) => commonModuleItemSchema.parse(item))
}

export async function listCommonModuleMetadata(
  database: Kysely<unknown>
): Promise<CommonModuleMetadataListResponse> {
  const modules = await getCommonModuleMetadata(database)

  return commonModuleMetadataListResponseSchema.parse({
    modules,
  })
}

export async function listCommonModuleSummaries(
  database: Kysely<unknown>
): Promise<CommonModuleSummaryListResponse> {
  const modules = await getCommonModuleMetadata(database)

  return commonModuleSummaryListResponseSchema.parse({
    items: await Promise.all(
      modules.map(async (module) => {
        const items = await getCommonModuleItems(database, module.key)
        const activeCount = items.filter((item) => item.isActive).length

        return {
          key: module.key,
          label: module.label,
          itemCount: items.length,
          activeCount,
        }
      })
    ),
  })
}

export async function listCommonModuleItems(
  database: Kysely<unknown>,
  moduleKey: string
): Promise<CommonModuleListResponse> {
  const parsedModuleKey = commonModuleKeySchema.parse(moduleKey) as CommonModuleKey
  const items = await getCommonModuleItems(database, parsedModuleKey)

  return commonModuleListResponseSchema.parse({
    module: parsedModuleKey,
    items,
  })
}
