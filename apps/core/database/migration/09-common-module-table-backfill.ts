import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { listCommonModuleDefinitions } from "../../src/common-modules/definitions.js"
import { commonModuleItemsByKey } from "../../src/common-modules/seed-data.js"
import { asQueryDatabase } from "../../src/data/query-database.js"

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

function getSeedColumnValue(
  item: Record<string, unknown>,
  column: {
    key: string
    type: "string" | "number" | "boolean"
    nullable: boolean
    numberMode?: "integer" | "decimal"
  }
) {
  const rawValue = item[column.key]

  if (rawValue !== undefined) {
    return toStoredValue(rawValue)
  }

  if (column.type === "boolean" && !column.nullable) {
    return 0
  }

  if (column.type === "number" && column.numberMode === "integer" && !column.nullable) {
    return 0
  }

  return null
}

export const coreCommonModuleTableBackfillMigration = defineDatabaseMigration({
  id: "core:common-modules:09-common-module-table-backfill",
  appId: "core",
  moduleKey: "common-modules",
  name: "Backfill newly added physical common module tables",
  order: 90,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    for (const definition of listCommonModuleDefinitions()) {
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
        continue
      }

      const seedItems = commonModuleItemsByKey[definition.key]
      if (!seedItems || seedItems.length === 0) {
        continue
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
              row[column.key] = getSeedColumnValue(item as Record<string, unknown>, column)
            }

            return row
          })
        )
        .execute()
    }
  },
})
