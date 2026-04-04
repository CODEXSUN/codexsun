import type { Kysely } from "kysely"

import {
  appSettingsResponseSchema,
  type AppSettingOption,
  type AppSettingsResponse,
} from "../../../framework/shared/index.js"
import { asQueryDatabase } from "../data/query-database.js"

import { coreTableNames } from "../../database/table-names.js"

function asString(value: unknown) {
  return String(value ?? "")
}

function asNullableString(value: unknown) {
  return value == null ? null : String(value)
}

export async function listAuthOptionCatalog(database: Kysely<unknown>) {
  const rows = await asQueryDatabase(database)
    .selectFrom(coreTableNames.authOptionCatalog)
    .selectAll()
    .where("is_active", "=", 1)
    .orderBy("category")
    .orderBy("label")
    .execute()

  return rows.map((row) => ({
    category: asString(row.category),
    key: asString(row.option_key),
    label: asString(row.label),
    summary: asNullableString(row.summary),
    appId: asNullableString(row.app_id),
    route: asNullableString(row.route),
    scopeType: asNullableString(row.scope_type),
  }) satisfies AppSettingOption)
}

export async function getAppSettingsSnapshot(
  database: Kysely<unknown>
): Promise<AppSettingsResponse> {
  const options = await listAuthOptionCatalog(database)
  const filterByCategory = (category: string) =>
    options.filter((option) => option.category === category)

  return appSettingsResponseSchema.parse({
    item: {
      loadedAt: new Date().toISOString(),
      authMetadata: {
        actorTypes: filterByCategory("actor-type"),
        permissionScopeTypes: filterByCategory("permission-scope-type"),
        permissionActionTypes: filterByCategory("permission-action-type"),
        apps: filterByCategory("app"),
        resources: filterByCategory("resource"),
      },
    },
  })
}
