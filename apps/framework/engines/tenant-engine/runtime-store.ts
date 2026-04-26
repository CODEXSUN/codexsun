import type { Kysely } from "kysely"

import {
  ensureJsonStoreTable,
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../apps/framework/src/runtime/database/process/json-store.js"

export const tenantEngineTableNames = {
  tenants: "engine_tenant_records",
  companyLinks: "engine_tenant_company_links",
  industryProfiles: "engine_tenant_industry_profiles",
} as const

export async function listTenantEngineRecords<T>(
  database: Kysely<unknown>,
  tableName: string
) {
  await ensureJsonStoreTable(database, tableName)
  return listJsonStorePayloads<T>(database, tableName)
}

export async function replaceTenantEngineRecords<
  T extends { id: string; createdAt?: string; updatedAt?: string },
>(
  database: Kysely<unknown>,
  tableName: string,
  moduleKey: string,
  items: T[]
) {
  await ensureJsonStoreTable(database, tableName)
  await replaceJsonStoreRecords(
    database,
    tableName,
    items.map((item, index) => ({
      id: item.id,
      moduleKey,
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}
