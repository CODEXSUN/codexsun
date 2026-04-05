import type { Kysely } from "kysely"

import {
  getFirstJsonStorePayload,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import {
  storefrontSettingsSchema,
  type StorefrontSettings,
} from "../../shared/index.js"
import { ecommerceTableNames } from "../../database/table-names.js"
import { defaultStorefrontSettings } from "../data/storefront-seed.js"

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function buildMergedStorefrontSettings(
  base: StorefrontSettings,
  payload: unknown,
  timestamp = base.updatedAt
) {
  const payloadRecord = asRecord(payload) ?? {}
  const heroRecord = asRecord(payloadRecord.hero)
  const searchRecord = asRecord(payloadRecord.search)
  const sectionsRecord = asRecord(payloadRecord.sections)
  const footerRecord = asRecord(payloadRecord.footer)
  const featuredRecord = asRecord(sectionsRecord?.featured)
  const categoriesRecord = asRecord(sectionsRecord?.categories)
  const newArrivalsRecord = asRecord(sectionsRecord?.newArrivals)
  const bestSellersRecord = asRecord(sectionsRecord?.bestSellers)
  const ctaRecord = asRecord(sectionsRecord?.cta)

  return storefrontSettingsSchema.parse({
    ...base,
    ...payloadRecord,
    hero: heroRecord
      ? {
          ...base.hero,
          ...heroRecord,
          highlights: Array.isArray(heroRecord.highlights)
            ? heroRecord.highlights
            : base.hero.highlights,
        }
      : base.hero,
    search: searchRecord
      ? {
          ...base.search,
          ...searchRecord,
          departments: Array.isArray(searchRecord.departments)
            ? searchRecord.departments
            : base.search.departments,
        }
      : base.search,
    sections: sectionsRecord
      ? {
          ...base.sections,
          ...(featuredRecord
            ? {
                featured: {
                  ...base.sections.featured,
                  ...featuredRecord,
                },
              }
            : {}),
          ...(categoriesRecord
            ? {
                categories: {
                  ...base.sections.categories,
                  ...categoriesRecord,
                },
              }
            : {}),
          ...(newArrivalsRecord
            ? {
                newArrivals: {
                  ...base.sections.newArrivals,
                  ...newArrivalsRecord,
                },
              }
            : {}),
          ...(bestSellersRecord
            ? {
                bestSellers: {
                  ...base.sections.bestSellers,
                  ...bestSellersRecord,
                },
              }
            : {}),
          ...(ctaRecord
            ? {
                cta: {
                  ...base.sections.cta,
                  ...ctaRecord,
                },
              }
            : {}),
        }
      : base.sections,
    trustNotes: Array.isArray(payloadRecord.trustNotes)
      ? payloadRecord.trustNotes
      : base.trustNotes,
    footer: footerRecord
      ? {
          ...base.footer,
          ...footerRecord,
          groups: Array.isArray(footerRecord.groups)
            ? footerRecord.groups
            : base.footer.groups,
        }
      : base.footer,
    id: base.id,
    createdAt: base.createdAt,
    updatedAt: timestamp,
  })
}

export async function getStorefrontSettings(
  database: Kysely<unknown>
): Promise<StorefrontSettings> {
  const stored = await getFirstJsonStorePayload<StorefrontSettings>(
    database,
    ecommerceTableNames.storefrontSettings
  )

  return buildMergedStorefrontSettings(defaultStorefrontSettings, stored ?? {})
}

export async function saveStorefrontSettings(
  database: Kysely<unknown>,
  payload: unknown
): Promise<StorefrontSettings> {
  const current = await getStorefrontSettings(database)
  const timestamp = new Date().toISOString()
  const nextSettings = buildMergedStorefrontSettings(current, payload, timestamp)

  await replaceJsonStoreRecords(database, ecommerceTableNames.storefrontSettings, [
    {
      id: nextSettings.id,
      payload: nextSettings,
      createdAt: nextSettings.createdAt,
      updatedAt: nextSettings.updatedAt,
    },
  ])

  return nextSettings
}
