import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { authOptionSeed } from "../../src/data/auth-option-seed.js"
import { asQueryDatabase } from "../../src/data/query-database.js"

import { coreTableNames } from "../table-names.js"

export const coreAuthOptionCatalogSeeder = defineDatabaseSeeder({
  id: "core:auth:09-auth-option-catalog",
  appId: "core",
  moduleKey: "auth",
  name: "Seed auth option catalog",
  order: 90,
  run: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)
    const timestamp = new Date().toISOString()

    await queryDatabase.deleteFrom(coreTableNames.authOptionCatalog).execute()
    await queryDatabase
      .insertInto(coreTableNames.authOptionCatalog)
      .values(
        authOptionSeed.map((option) => ({
          id: `${option.category}:${option.appId ?? "global"}:${option.scopeType ?? "none"}:${option.key}`,
          category: option.category,
          option_key: option.key,
          label: option.label,
          summary: option.summary,
          app_id: option.appId,
          route: option.route,
          scope_type: option.scopeType,
          is_active: 1,
          created_at: timestamp,
          updated_at: timestamp,
        }))
      )
      .execute()
  },
})
