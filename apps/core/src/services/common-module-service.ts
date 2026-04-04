import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  commonModuleItemSchema,
  commonModuleKeySchema,
  commonModuleListResponseSchema,
  commonModuleMetadataListResponseSchema,
  commonModuleRecordResponseSchema,
  commonModuleSummaryListResponseSchema,
  commonModuleUpsertPayloadSchema,
  type CommonModuleItem,
  type CommonModuleKey,
  type CommonModuleListResponse,
  type CommonModuleMetadata,
  type CommonModuleMetadataListResponse,
  type CommonModuleRecordResponse,
  type CommonModuleSummaryListResponse,
} from "../../shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

import {
  type CommonModuleDefinition,
  getCommonModuleDefinition,
  listCommonModuleDefinitions,
  toCommonModuleMetadata,
} from "../common-modules/definitions.js"
import { commonModuleItemsByKey } from "../common-modules/seed-data.js"
import { asQueryDatabase } from "../data/query-database.js"

type CommonModuleRow = {
  id: string
  is_active: number | boolean
  created_at: string
  updated_at: string
  [key: string]: unknown
}

const defaultCommonModuleRecordId = "1"

type ColumnConfigurator = {
  primaryKey: () => ColumnConfigurator
  notNull: () => ColumnConfigurator
  defaultTo: (value: unknown) => ColumnConfigurator
}

type TableBuilder = {
  ifNotExists: () => TableBuilder
  addColumn: (
    name: string,
    dataType: string,
    configure?: (column: ColumnConfigurator) => ColumnConfigurator
  ) => TableBuilder
  execute: () => Promise<void>
}

function normalizeBooleanValue(value: unknown) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value !== 0
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase()

    if (["true", "1", "yes", "y", "on"].includes(normalizedValue)) {
      return true
    }

    if (["false", "0", "no", "n", "off"].includes(normalizedValue)) {
      return false
    }
  }

  return Boolean(value)
}

function isMissingCommonModuleTableError(error: unknown, tableName: string) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  const normalizedTableName = tableName.toLowerCase()

  return (
    (message.includes("no such table") && message.includes(normalizedTableName)) ||
    (message.includes("doesn't exist") && message.includes(normalizedTableName)) ||
    (message.includes("does not exist") && message.includes(normalizedTableName))
  )
}

function resolveColumnType(column: {
  type: "string" | "number" | "boolean"
  numberMode?: "integer" | "decimal"
}) {
  if (column.type === "boolean") {
    return "integer"
  }

  if (column.type === "number") {
    return column.numberMode === "decimal" ? "real" : "integer"
  }

  return "text"
}

function toStoredValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? 1 : 0
  }

  return value ?? null
}

async function ensurePhysicalCommonModuleTable(
  database: Kysely<unknown>,
  definition: CommonModuleDefinition
) {
  const queryDatabase = asQueryDatabase(database)
  let builder = queryDatabase.schema
    .createTable(definition.tableName)
    .ifNotExists()
    .addColumn("id", "varchar(191)", (column) => column.primaryKey()) as unknown as TableBuilder

  for (const column of definition.columns) {
    builder = builder.addColumn(column.key, resolveColumnType(column), (columnBuilder) => {
      let next = columnBuilder
      if (!column.nullable) {
        next = next.notNull()
      }
      if (column.type === "boolean" && !column.nullable) {
        next = next.defaultTo(0)
      }
      if (column.type === "number" && column.numberMode === "integer" && !column.required) {
        next = next.defaultTo(0)
      }
      return next
    })
  }

  await builder
    .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .execute()

  const existingRow = await queryDatabase
    .selectFrom(definition.tableName)
    .select("id")
    .executeTakeFirst()

  if (existingRow) {
    return
  }

  const seedItems = commonModuleItemsByKey[definition.key]
  if (!seedItems || seedItems.length === 0) {
    return
  }

  await queryDatabase
    .insertInto(definition.tableName)
    .values(
      seedItems.map((item) => {
        const row: Record<string, unknown> = {
          id: item.id,
          is_active: item.isActive ? 1 : 0,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        }

        for (const column of definition.columns) {
          row[column.key] = toStoredValue(item[column.key])
        }

        return row
      })
    )
    .execute()
}

function toCommonModuleItem(
  definition: CommonModuleDefinition,
  row: CommonModuleRow
): CommonModuleItem {
  const item: Record<string, unknown> = {
    id: row.id,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  for (const column of definition.columns) {
    const value = row[column.key]

    if (column.type === "boolean") {
      item[column.key] = normalizeBooleanValue(value)
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
}

async function getCommonModuleItems(
  database: Kysely<unknown>,
  moduleKey: CommonModuleKey
): Promise<CommonModuleItem[]> {
  const definition = getCommonModuleDefinition(moduleKey)
  let rows: CommonModuleRow[]

  try {
    rows = await asQueryDatabase(database)
      .selectFrom(definition.tableName)
      .selectAll()
      .orderBy(definition.defaultSortKey as never)
      .orderBy("created_at")
      .execute() as CommonModuleRow[]
  } catch (error) {
    if (isMissingCommonModuleTableError(error, definition.tableName)) {
      await ensurePhysicalCommonModuleTable(database, definition)
      rows = await asQueryDatabase(database)
        .selectFrom(definition.tableName)
        .selectAll()
        .orderBy(definition.defaultSortKey as never)
        .orderBy("created_at")
        .execute() as CommonModuleRow[]
    } else {
      throw error
    }
  }

  return rows.map((row) => toCommonModuleItem(definition, row))
}

async function getCommonModuleRow(
  database: Kysely<unknown>,
  definition: CommonModuleDefinition,
  itemId: string
) {
  try {
    return (await asQueryDatabase(database)
      .selectFrom(definition.tableName)
      .selectAll()
      .where("id", "=", itemId)
      .executeTakeFirst()) as CommonModuleRow | undefined
  } catch (error) {
    if (isMissingCommonModuleTableError(error, definition.tableName)) {
      await ensurePhysicalCommonModuleTable(database, definition)
      return (await asQueryDatabase(database)
        .selectFrom(definition.tableName)
        .selectAll()
        .where("id", "=", itemId)
        .executeTakeFirst()) as CommonModuleRow | undefined
    }

    throw error
  }
}

async function ensureReferencedItemExists(
  database: Kysely<unknown>,
  moduleKey: CommonModuleKey,
  itemId: string,
  columnLabel: string
) {
  const definition = getCommonModuleDefinition(moduleKey)
  const existingRow = await getCommonModuleRow(database, definition, itemId)

  if (!existingRow) {
    throw new ApplicationError(`${columnLabel} references an unknown ${definition.label} record.`, {}, 400)
  }
}

async function ensureCommonModuleItemIsNotReferenced(
  database: Kysely<unknown>,
  definition: CommonModuleDefinition,
  itemId: string
) {
  for (const referencingDefinition of listCommonModuleDefinitions()) {
    for (const column of referencingDefinition.columns) {
      if (column.referenceModule !== definition.key) {
        continue
      }

      try {
        const dependentRow = await asQueryDatabase(database)
          .selectFrom(referencingDefinition.tableName)
          .select("id")
          .where(column.key as never, "=", itemId)
          .executeTakeFirst()

        if (dependentRow) {
          throw new ApplicationError(
            `${definition.label} record cannot be deleted because it is referenced by ${referencingDefinition.label}. Remove dependent records first.`,
            {},
            409
          )
        }
      } catch (error) {
        if (error instanceof ApplicationError) {
          throw error
        }

        if (isMissingCommonModuleTableError(error, referencingDefinition.tableName)) {
          continue
        }

        throw error
      }
    }
  }
}

function normalizeCommonModuleNumberValue(
  value: unknown,
  options: {
    allowNull: boolean
    fieldLabel: string
    integerMode: boolean
  }
) {
  if (value === null || value === undefined || value === "") {
    return options.allowNull ? null : 0
  }

  const normalizedValue = typeof value === "number" ? value : Number(value)

  if (!Number.isFinite(normalizedValue)) {
    throw new ApplicationError(`${options.fieldLabel} must be a valid number.`, {}, 400)
  }

  if (options.integerMode && !Number.isInteger(normalizedValue)) {
    throw new ApplicationError(`${options.fieldLabel} must be a whole number.`, {}, 400)
  }

  return normalizedValue
}

async function normalizeCommonModulePayload(
  database: Kysely<unknown>,
  definition: CommonModuleDefinition,
  payload: unknown,
  existingItem?: CommonModuleItem | null
) {
  const parsedPayload = commonModuleUpsertPayloadSchema.parse(payload ?? {})
  const normalizedRow: Record<string, unknown> = {}

  for (const column of definition.columns) {
    const nextRawValue =
      parsedPayload[column.key] === undefined ? existingItem?.[column.key] : parsedPayload[column.key]

    if (column.type === "boolean") {
      normalizedRow[column.key] = normalizeBooleanValue(nextRawValue)
      continue
    }

    if (column.type === "number") {
      const normalizedValue = normalizeCommonModuleNumberValue(nextRawValue, {
        allowNull: column.nullable,
        fieldLabel: column.label,
        integerMode: column.numberMode === "integer",
      })

      if (!column.nullable && column.required && normalizedValue === null) {
        throw new ApplicationError(`${column.label} is required.`, {}, 400)
      }

      normalizedRow[column.key] = normalizedValue
      continue
    }

    const normalizedValue =
      nextRawValue === null || nextRawValue === undefined
        ? null
        : String(nextRawValue).trim()

    if (!column.nullable && (!normalizedValue || normalizedValue.length === 0)) {
      throw new ApplicationError(`${column.label} is required.`, {}, 400)
    }

    if (column.referenceModule && normalizedValue) {
      await ensureReferencedItemExists(database, column.referenceModule, normalizedValue, column.label)
    }

    normalizedRow[column.key] = normalizedValue && normalizedValue.length > 0 ? normalizedValue : null
  }

  return {
    isActive:
      parsedPayload.isActive === undefined
        ? existingItem?.isActive ?? true
        : Boolean(parsedPayload.isActive),
    row: normalizedRow,
  }
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

export async function getCommonModuleItem(
  database: Kysely<unknown>,
  moduleKey: string,
  itemId: string
): Promise<CommonModuleRecordResponse> {
  const parsedModuleKey = commonModuleKeySchema.parse(moduleKey) as CommonModuleKey
  const definition = getCommonModuleDefinition(parsedModuleKey)
  const row = await getCommonModuleRow(database, definition, itemId)

  if (!row) {
    throw new ApplicationError(`${definition.label} record not found.`, {}, 404)
  }

  return commonModuleRecordResponseSchema.parse({
    module: parsedModuleKey,
    item: toCommonModuleItem(definition, row),
  })
}

export async function createCommonModuleItem(
  database: Kysely<unknown>,
  moduleKey: string,
  payload: unknown
): Promise<CommonModuleRecordResponse> {
  const parsedModuleKey = commonModuleKeySchema.parse(moduleKey) as CommonModuleKey
  const definition = getCommonModuleDefinition(parsedModuleKey)
  await ensurePhysicalCommonModuleTable(database, definition)
  const { isActive, row } = await normalizeCommonModulePayload(database, definition, payload)
  const timestamp = new Date().toISOString()
  const itemId = `common-${parsedModuleKey}:${randomUUID()}`

  await asQueryDatabase(database)
    .insertInto(definition.tableName)
    .values({
      id: itemId,
      ...row,
      is_active: isActive ? 1 : 0,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .execute()

  return getCommonModuleItem(database, parsedModuleKey, itemId)
}

export async function updateCommonModuleItem(
  database: Kysely<unknown>,
  moduleKey: string,
  itemId: string,
  payload: unknown
): Promise<CommonModuleRecordResponse> {
  const existingRecord = await getCommonModuleItem(database, moduleKey, itemId)
  const definition = getCommonModuleDefinition(existingRecord.module)
  const { isActive, row } = await normalizeCommonModulePayload(
    database,
    definition,
    payload,
    existingRecord.item
  )

  await asQueryDatabase(database)
    .updateTable(definition.tableName)
    .set({
      ...row,
      is_active: isActive ? 1 : 0,
      updated_at: new Date().toISOString(),
    })
    .where("id", "=", itemId)
    .execute()

  return getCommonModuleItem(database, existingRecord.module, itemId)
}

export async function deleteCommonModuleItem(
  database: Kysely<unknown>,
  moduleKey: string,
  itemId: string
) {
  const parsedModuleKey = commonModuleKeySchema.parse(moduleKey) as CommonModuleKey
  const definition = getCommonModuleDefinition(parsedModuleKey)
  const existingRow = await getCommonModuleRow(database, definition, itemId)

  if (!existingRow) {
    throw new ApplicationError(`${definition.label} record not found.`, {}, 404)
  }

  if (itemId === defaultCommonModuleRecordId) {
    throw new ApplicationError(
      `${definition.label} default record cannot be deleted.`,
      {},
      409
    )
  }

  await ensureCommonModuleItemIsNotReferenced(database, definition, itemId)

  await asQueryDatabase(database)
    .deleteFrom(definition.tableName)
    .where("id", "=", itemId)
    .execute()

  return {
    deleted: true as const,
    id: itemId,
    module: parsedModuleKey,
  }
}
