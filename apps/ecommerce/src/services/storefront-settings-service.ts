import type { Kysely } from "kysely"

import {
  getFirstJsonStorePayload,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import {
  storefrontSettingsSchema,
  storefrontHomeSliderSchema,
  storefrontHomeSliderSlideSchema,
  storefrontHomeSliderThemeSchema,
  type StorefrontHomeSlider,
  type StorefrontHomeSliderSlide,
  type StorefrontHomeSliderTheme,
  type StorefrontSettings,
} from "../../shared/index.js"
import { ecommerceTableNames } from "../../database/table-names.js"
import { defaultStorefrontSettings } from "../data/storefront-seed.js"

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null
}

const fallbackHomeSliderTheme: StorefrontHomeSliderTheme = {
  themeKey: "signature-ember",
  backgroundFrom: "#3d2219",
  backgroundVia: "#7c5642",
  backgroundTo: "#efe3d6",
  textColor: null,
  mutedTextColor: null,
  badgeBackground: null,
  badgeTextColor: null,
  primaryButtonLabel: "Buy now",
  secondaryButtonLabel: "View details",
  primaryButtonBackground: null,
  primaryButtonTextColor: null,
  secondaryButtonBackground: null,
  secondaryButtonTextColor: null,
  navBackground: null,
  navTextColor: null,
  frameBackground: null,
  outerFrameBorderColor: null,
  innerFrameBorderColor: null,
  imagePanelBackground: "#ffffff",
}

function buildMergedHomeSliderTheme(
  base: StorefrontHomeSliderTheme,
  payload: unknown
): StorefrontHomeSliderTheme {
  return storefrontHomeSliderThemeSchema.parse({
    ...base,
    ...(asRecord(payload) ?? {}),
  })
}

function buildSliderSeed(index: number, fallbackTheme: StorefrontHomeSliderTheme) {
  const sequence = String(index + 1).padStart(2, "0")

  return {
    id: `home-slider:${sequence}`,
    label: `Slider ${sequence}`,
    theme: fallbackTheme,
  } satisfies StorefrontHomeSliderSlide
}

function buildMergedHomeSlider(
  base: StorefrontHomeSlider,
  payload: unknown
): StorefrontHomeSlider {
  const payloadRecord = asRecord(payload)
  const defaultTheme =
    defaultStorefrontSettings.homeSlider.slides[0]?.theme ?? fallbackHomeSliderTheme
  const firstBaseSlide = base.slides[0] ?? buildSliderSeed(0, defaultTheme)

  if (!payloadRecord) {
    return storefrontHomeSliderSchema.parse(base)
  }

  if (!Array.isArray(payloadRecord.slides)) {
    return storefrontHomeSliderSchema.parse({
      slides: base.slides.map((slide, index) =>
        index === 0
          ? storefrontHomeSliderSlideSchema.parse({
              ...slide,
              theme: buildMergedHomeSliderTheme(slide.theme, payloadRecord),
            })
          : slide
      ),
    })
  }

  const slides = payloadRecord.slides
    .map((item, index) => {
      const itemRecord = asRecord(item)
      const baseSlide = base.slides[index] ?? buildSliderSeed(index, firstBaseSlide.theme)

      if (!itemRecord) {
        return baseSlide
      }

      const themeRecord = asRecord(itemRecord.theme)

      return storefrontHomeSliderSlideSchema.parse({
        ...baseSlide,
        ...itemRecord,
        id:
          typeof itemRecord.id === "string" && itemRecord.id.trim().length > 0
            ? itemRecord.id
            : baseSlide.id,
        label:
          typeof itemRecord.label === "string" && itemRecord.label.trim().length > 0
            ? itemRecord.label
            : baseSlide.label,
        theme: buildMergedHomeSliderTheme(
          baseSlide.theme,
          themeRecord ?? itemRecord
        ),
      })
    })
    .filter((item) => item != null)

  return storefrontHomeSliderSchema.parse({
    slides: slides.length > 0 ? slides : base.slides,
  })
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
    homeSlider: buildMergedHomeSlider(base.homeSlider, payloadRecord.homeSlider),
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

export async function getStorefrontHomeSlider(
  database: Kysely<unknown>
): Promise<StorefrontHomeSlider> {
  const settings = await getStorefrontSettings(database)
  return storefrontHomeSliderSchema.parse(settings.homeSlider)
}

export async function saveStorefrontHomeSlider(
  database: Kysely<unknown>,
  payload: unknown
): Promise<StorefrontHomeSlider> {
  const current = await getStorefrontSettings(database)
  const parsedPayload = buildMergedHomeSlider(current.homeSlider, payload)

  const nextSettings = await saveStorefrontSettings(database, {
    homeSlider: parsedPayload,
  })

  return storefrontHomeSliderSchema.parse(nextSettings.homeSlider)
}
