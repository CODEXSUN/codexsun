import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { listCommonModuleDefinitions } from "../../src/common-modules/definitions.js"
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

export const coreCommonModuleTablesMigration = defineDatabaseMigration({
  id: "core:common-modules:08-common-module-tables",
  appId: "core",
  moduleKey: "common-modules",
  name: "Create physical common module tables",
  order: 80,
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
    }
  },
})
