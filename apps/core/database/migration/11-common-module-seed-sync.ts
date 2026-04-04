import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { listCommonModuleDefinitions } from "../../src/common-modules/definitions.js"
import { commonModuleItemsByKey } from "../../src/common-modules/seed-data.js"
import { asQueryDatabase } from "../../src/data/query-database.js"

function toStoredValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? 1 : 0
  }

  return value ?? null
}

export const coreCommonModuleSeedSyncMigration = defineDatabaseMigration({
  id: "core:common-modules:11-common-module-seed-sync",
  appId: "core",
  moduleKey: "common-modules",
  name: "Insert missing seeded common module rows into existing tables",
  order: 110,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    for (const definition of listCommonModuleDefinitions()) {
      const seedItems = commonModuleItemsByKey[definition.key]
      if (!seedItems || seedItems.length === 0) {
        continue
      }

      for (const item of seedItems) {
        const existingRow = await queryDatabase
          .selectFrom(definition.tableName)
          .select("id")
          .where("id", "=", item.id)
          .executeTakeFirst()

        if (existingRow) {
          continue
        }

        const row: Record<string, unknown> = {
          id: item.id,
          is_active: item.isActive ? 1 : 0,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        }

        for (const column of definition.columns) {
          row[column.key] = toStoredValue(item[column.key])
        }

        await queryDatabase.insertInto(definition.tableName).values(row).execute()
      }
    }
  },
})
