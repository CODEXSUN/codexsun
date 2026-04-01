import type { Kysely } from "kysely"

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

import {
  getCommonModuleDefinition,
  listCommonModuleDefinitions,
  toCommonModuleMetadata,
} from "../common-modules/definitions.js"
import { asQueryDatabase } from "../data/query-database.js"

type CommonModuleRow = {
  id: string
  is_active: number | boolean
  created_at: string
  updated_at: string
  [key: string]: unknown
}

async function getCommonModuleItems(
  database: Kysely<unknown>,
  moduleKey: CommonModuleKey
): Promise<CommonModuleItem[]> {
  const definition = getCommonModuleDefinition(moduleKey)
  const rows = await asQueryDatabase(database)
    .selectFrom(definition.tableName)
    .selectAll()
    .orderBy(definition.defaultSortKey as never)
    .orderBy("created_at")
    .execute() as CommonModuleRow[]

  return rows.map((row) => {
    const item: Record<string, unknown> = {
      id: row.id,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    for (const column of definition.columns) {
      const value = row[column.key]

      if (column.type === "boolean") {
        item[column.key] = Boolean(value)
        continue
      }

      if (column.type === "number") {
        item[column.key] =
          value === null || value === undefined
            ? null
            : typeof value === "number"
              ? value
              : Number(value)
        continue
      }

      item[column.key] = value ?? null
    }

    return commonModuleItemSchema.parse(item)
  })
}

export async function listCommonModuleMetadata(
  database: Kysely<unknown>
): Promise<CommonModuleMetadataListResponse> {
  void database
  return commonModuleMetadataListResponseSchema.parse({
    modules: listCommonModuleDefinitions().map((definition) =>
      toCommonModuleMetadata(definition)
    ) satisfies CommonModuleMetadata[],
  })
}

export async function listCommonModuleSummaries(
  database: Kysely<unknown>
): Promise<CommonModuleSummaryListResponse> {
  const modules = listCommonModuleDefinitions().map((definition) =>
    toCommonModuleMetadata(definition)
  )

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
