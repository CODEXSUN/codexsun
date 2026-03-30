import type { Kysely } from "kysely"

import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import {
  companyListResponseSchema,
  type Company,
  type CompanyListResponse,
} from "../../shared/index.js"

import { coreTableNames } from "../../database/table-names.js"

export async function listCompanies(
  database: Kysely<unknown>
): Promise<CompanyListResponse> {
  const items = await listJsonStorePayloads<Company>(
    database,
    coreTableNames.companies
  )

  return companyListResponseSchema.parse({
    items,
  })
}
