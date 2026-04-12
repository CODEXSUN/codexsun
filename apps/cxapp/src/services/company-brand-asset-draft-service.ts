import type { Kysely } from "kysely"

import {
  companyBrandAssetDraftReadResponseSchema,
  companyBrandAssetDraftResponseSchema,
  companyBrandAssetDraftSchema,
  companyBrandAssetDraftUpsertPayloadSchema,
  type CompanyBrandAssetDraftReadResponse,
  type CompanyBrandAssetDraftResponse,
} from "../../shared/index.js"

import { cxappTableNames } from "../../database/table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>
type JsonStoreDraftRow = {
  id: string
  module_key: string | null
  sort_order: number
  payload: string
  created_at: string
  updated_at: string
}

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export async function readCompanyBrandAssetDraft(
  database: Kysely<unknown>,
  companyId: string
): Promise<CompanyBrandAssetDraftReadResponse> {
  const row = (await asQueryDatabase(database)
    .selectFrom(cxappTableNames.companyBrandAssetDrafts)
    .selectAll()
    .where("id", "=", companyId)
    .executeTakeFirst()) as JsonStoreDraftRow | undefined

  if (!row) {
    return companyBrandAssetDraftReadResponseSchema.parse({
      item: null,
    })
  }

  return companyBrandAssetDraftReadResponseSchema.parse({
    item: companyBrandAssetDraftSchema.parse(JSON.parse(row.payload)),
  })
}

export async function saveCompanyBrandAssetDraft(
  database: Kysely<unknown>,
  companyId: string,
  payload: unknown
): Promise<CompanyBrandAssetDraftResponse> {
  const parsedPayload = companyBrandAssetDraftUpsertPayloadSchema.parse(payload)
  const existing = await readCompanyBrandAssetDraft(database, companyId)
  const timestamp = new Date().toISOString()
  const record = companyBrandAssetDraftSchema.parse({
    companyId,
    designer: parsedPayload.designer,
    createdAt: existing.item?.createdAt ?? timestamp,
    updatedAt: timestamp,
  })

  await asQueryDatabase(database)
    .insertInto(cxappTableNames.companyBrandAssetDrafts)
    .values({
      id: companyId,
      module_key: "company-brand-assets",
      sort_order: 1,
      payload: JSON.stringify(record),
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    })
    .onConflict((conflict) =>
      conflict.column("id").doUpdateSet({
        module_key: "company-brand-assets",
        sort_order: 1,
        payload: JSON.stringify(record),
        updated_at: record.updatedAt,
      })
    )
    .execute()

  return companyBrandAssetDraftResponseSchema.parse({
    item: record,
  })
}

export async function deleteCompanyBrandAssetDraft(
  database: Kysely<unknown>,
  companyId: string
) {
  await asQueryDatabase(database)
    .deleteFrom(cxappTableNames.companyBrandAssetDrafts)
    .where("id", "=", companyId)
    .execute()
}
