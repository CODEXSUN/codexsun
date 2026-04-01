import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { getCommonModuleDefinition, listCommonModuleDefinitions } from "../../src/common-modules/definitions.js"
import { commonModuleItemsByKey } from "../../src/common-modules/seed-data.js"
import { asQueryDatabase } from "../../src/data/query-database.js"

function toStoredValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? 1 : 0
  }

  return value ?? null
}

export const coreCommonModuleTablesSeeder = defineDatabaseSeeder({
  id: "core:common-modules:07-common-module-tables",
  appId: "core",
  moduleKey: "common-modules",
  name: "Seed physical common module tables",
  order: 70,
  run: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)
    const definitions = listCommonModuleDefinitions()

    for (const definition of [...definitions].reverse()) {
      await queryDatabase.deleteFrom(definition.tableName).execute()
    }

    for (const [moduleKey, items] of Object.entries(commonModuleItemsByKey)) {
      if (items.length === 0) {
        continue
      }

      const definition = getCommonModuleDefinition(moduleKey as keyof typeof commonModuleItemsByKey)
      await queryDatabase
        .insertInto(definition.tableName)
        .values(
          items.map((item) => {
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
  },
})
