import type { Kysely } from "kysely"

import {
  getFirstJsonStorePayload,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import {
  storefrontFooterSchema,
  storefrontFloatingContactSchema,
  storefrontPickupLocationSchema,
  storefrontCouponBannerSchema,
  storefrontGiftCornerSchema,
  storefrontTrendingSectionSchema,
  storefrontBrandShowcaseSchema,
  storefrontCampaignSectionSchema,
  storefrontAnnouncementItemSchema,
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
  const announcementDesignRecord = asRecord(payloadRecord.announcementDesign)
  const announcementItemsRecord = Array.isArray(payloadRecord.announcementItems)
    ? payloadRecord.announcementItems
    : null
  const visibilityRecord = asRecord(payloadRecord.visibility)
  const sectionsRecord = asRecord(payloadRecord.sections)
  const footerRecord = asRecord(payloadRecord.footer)
  const floatingContactRecord = asRecord(payloadRecord.floatingContact)
  const shippingMethodsRecord = Array.isArray(payloadRecord.shippingMethods)
    ? payloadRecord.shippingMethods
    : null
  const shippingZonesRecord = Array.isArray(payloadRecord.shippingZones)
    ? payloadRecord.shippingZones
    : null
  const couponBannerRecord = asRecord(payloadRecord.couponBanner)
  const giftCornerRecord = asRecord(payloadRecord.giftCorner)
  const trendingSectionRecord = asRecord(payloadRecord.trendingSection)
  const brandShowcaseRecord = asRecord(payloadRecord.brandShowcase)
  const campaignDesignRecord = asRecord(payloadRecord.campaignDesign)
  const legalPagesRecord = asRecord(payloadRecord.legalPages)
  const featuredRecord = asRecord(sectionsRecord?.featured)
  const categoriesRecord = asRecord(sectionsRecord?.categories)
  const newArrivalsRecord = asRecord(sectionsRecord?.newArrivals)
  const bestSellersRecord = asRecord(sectionsRecord?.bestSellers)
  const ctaRecord = asRecord(sectionsRecord?.cta)
  const featuredCardDesignRecord = asRecord(featuredRecord?.cardDesign)
  const categoriesCardDesignRecord = asRecord(categoriesRecord?.cardDesign)

  return storefrontSettingsSchema.parse({
    ...base,
    ...payloadRecord,
    visibility: visibilityRecord
      ? {
          ...base.visibility,
          ...visibilityRecord,
        }
      : base.visibility,
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
    announcementDesign: announcementDesignRecord
      ? {
          ...base.announcementDesign,
          ...announcementDesignRecord,
        }
      : base.announcementDesign,
    announcementItems: announcementItemsRecord
      ? announcementItemsRecord.map((item) => storefrontAnnouncementItemSchema.parse(item))
      : base.announcementItems,
    sections: sectionsRecord
      ? {
          ...base.sections,
          ...(featuredRecord
            ? {
                featured: {
                  ...base.sections.featured,
                  ...featuredRecord,
                  rowsToShow:
                    typeof featuredRecord.rowsToShow === "number"
                      ? featuredRecord.rowsToShow
                      : base.sections.featured.rowsToShow,
                  cardDesign: featuredCardDesignRecord
                    ? {
                        ...base.sections.featured.cardDesign,
                        ...featuredCardDesignRecord,
                      }
                    : base.sections.featured.cardDesign,
                },
              }
            : {}),
          ...(categoriesRecord
            ? {
                categories: {
                  ...base.sections.categories,
                  ...categoriesRecord,
                  rowsToShow:
                    typeof categoriesRecord.rowsToShow === "number"
                      ? categoriesRecord.rowsToShow
                      : base.sections.categories.rowsToShow,
                  cardDesign: categoriesCardDesignRecord
                    ? {
                        ...base.sections.categories.cardDesign,
                        ...categoriesCardDesignRecord,
                      }
                    : base.sections.categories.cardDesign,
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
          design: asRecord(footerRecord.design)
            ? {
                ...base.footer.design,
                ...asRecord(footerRecord.design),
              }
            : base.footer.design,
          groups: Array.isArray(footerRecord.groups)
            ? footerRecord.groups
            : base.footer.groups,
          socialLinks: Array.isArray(footerRecord.socialLinks)
            ? footerRecord.socialLinks
            : base.footer.socialLinks,
        }
      : base.footer,
    floatingContact: floatingContactRecord
      ? {
          ...base.floatingContact,
          ...floatingContactRecord,
        }
      : base.floatingContact,
    shippingMethods: shippingMethodsRecord ? shippingMethodsRecord : base.shippingMethods,
    shippingZones: shippingZonesRecord ? shippingZonesRecord : base.shippingZones,
    couponBanner: couponBannerRecord
      ? {
          ...base.couponBanner,
          ...couponBannerRecord,
        }
      : base.couponBanner,
    giftCorner: giftCornerRecord
      ? {
          ...base.giftCorner,
          ...giftCornerRecord,
        }
      : base.giftCorner,
    trendingSection: trendingSectionRecord
      ? {
          ...base.trendingSection,
          ...trendingSectionRecord,
          cards: Array.isArray(trendingSectionRecord.cards)
            ? trendingSectionRecord.cards
            : base.trendingSection.cards,
        }
      : base.trendingSection,
    brandShowcase: brandShowcaseRecord
      ? {
          ...base.brandShowcase,
          ...brandShowcaseRecord,
          cards: Array.isArray(brandShowcaseRecord.cards)
            ? brandShowcaseRecord.cards
            : base.brandShowcase.cards,
        }
      : base.brandShowcase,
    campaignDesign: campaignDesignRecord
      ? {
          ...base.campaignDesign,
          ...campaignDesignRecord,
        }
      : base.campaignDesign,
    legalPages: legalPagesRecord
      ? {
          shipping: asRecord(legalPagesRecord.shipping)
            ? {
                ...base.legalPages.shipping,
                ...asRecord(legalPagesRecord.shipping),
              }
            : base.legalPages.shipping,
          returns: asRecord(legalPagesRecord.returns)
            ? {
                ...base.legalPages.returns,
                ...asRecord(legalPagesRecord.returns),
              }
            : base.legalPages.returns,
          privacy: asRecord(legalPagesRecord.privacy)
            ? {
                ...base.legalPages.privacy,
                ...asRecord(legalPagesRecord.privacy),
              }
            : base.legalPages.privacy,
          terms: asRecord(legalPagesRecord.terms)
            ? {
                ...base.legalPages.terms,
                ...asRecord(legalPagesRecord.terms),
              }
            : base.legalPages.terms,
          contact: asRecord(legalPagesRecord.contact)
            ? {
                ...base.legalPages.contact,
                ...asRecord(legalPagesRecord.contact),
              }
            : base.legalPages.contact,
        }
      : base.legalPages,
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

export async function getStorefrontFooter(
  database: Kysely<unknown>
) {
  const settings = await getStorefrontSettings(database)
  return storefrontFooterSchema.parse(settings.footer)
}

export async function saveStorefrontFooter(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontSettings(database)
  const nextSettings = await saveStorefrontSettings(database, {
    footer: storefrontFooterSchema.parse({
      ...current.footer,
      ...(asRecord(payload) ?? {}),
      design: {
        ...current.footer.design,
        ...(asRecord(asRecord(payload)?.design) ?? {}),
      },
      socialLinks: Array.isArray(asRecord(payload)?.socialLinks)
        ? asRecord(payload)?.socialLinks
        : current.footer.socialLinks,
      groups: Array.isArray(asRecord(payload)?.groups)
        ? asRecord(payload)?.groups
        : current.footer.groups,
    }),
  })

  return storefrontFooterSchema.parse(nextSettings.footer)
}

export async function getStorefrontFloatingContact(
  database: Kysely<unknown>
) {
  const settings = await getStorefrontSettings(database)
  return storefrontFloatingContactSchema.parse(settings.floatingContact)
}

export async function saveStorefrontFloatingContact(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontSettings(database)
  const nextSettings = await saveStorefrontSettings(database, {
    floatingContact: storefrontFloatingContactSchema.parse({
      ...current.floatingContact,
      ...(asRecord(payload) ?? {}),
    }),
  })

  return storefrontFloatingContactSchema.parse(nextSettings.floatingContact)
}

export async function getStorefrontPickupLocation(
  database: Kysely<unknown>
) {
  const settings = await getStorefrontSettings(database)
  return storefrontPickupLocationSchema.parse(settings.pickupLocation)
}

export async function saveStorefrontPickupLocation(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontSettings(database)
  const nextSettings = await saveStorefrontSettings(database, {
    pickupLocation: storefrontPickupLocationSchema.parse({
      ...current.pickupLocation,
      ...(asRecord(payload) ?? {}),
    }),
  })

  return storefrontPickupLocationSchema.parse(nextSettings.pickupLocation)
}

export async function getStorefrontCouponBanner(
  database: Kysely<unknown>
) {
  const settings = await getStorefrontSettings(database)
  return storefrontCouponBannerSchema.parse(settings.couponBanner)
}

export async function saveStorefrontCouponBanner(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontSettings(database)
  const nextSettings = await saveStorefrontSettings(database, {
    couponBanner: storefrontCouponBannerSchema.parse({
      ...current.couponBanner,
      ...(asRecord(payload) ?? {}),
    }),
  })

  return storefrontCouponBannerSchema.parse(nextSettings.couponBanner)
}

export async function getStorefrontGiftCorner(
  database: Kysely<unknown>
) {
  const settings = await getStorefrontSettings(database)
  return storefrontGiftCornerSchema.parse(settings.giftCorner)
}

export async function saveStorefrontGiftCorner(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontSettings(database)
  const nextSettings = await saveStorefrontSettings(database, {
    giftCorner: storefrontGiftCornerSchema.parse({
      ...current.giftCorner,
      ...(asRecord(payload) ?? {}),
    }),
  })

  return storefrontGiftCornerSchema.parse(nextSettings.giftCorner)
}

export async function getStorefrontTrendingSection(
  database: Kysely<unknown>
) {
  const settings = await getStorefrontSettings(database)
  return storefrontTrendingSectionSchema.parse(settings.trendingSection)
}

export async function saveStorefrontTrendingSection(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontSettings(database)
  const nextSettings = await saveStorefrontSettings(database, {
    trendingSection: storefrontTrendingSectionSchema.parse({
      ...current.trendingSection,
      ...(asRecord(payload) ?? {}),
      cards: Array.isArray(asRecord(payload)?.cards)
        ? asRecord(payload)?.cards
        : current.trendingSection.cards,
    }),
  })

  return storefrontTrendingSectionSchema.parse(nextSettings.trendingSection)
}

export async function getStorefrontBrandShowcase(
  database: Kysely<unknown>
) {
  const settings = await getStorefrontSettings(database)
  return storefrontBrandShowcaseSchema.parse(settings.brandShowcase)
}

export async function saveStorefrontBrandShowcase(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontSettings(database)
  const nextSettings = await saveStorefrontSettings(database, {
    brandShowcase: storefrontBrandShowcaseSchema.parse({
      ...current.brandShowcase,
      ...(asRecord(payload) ?? {}),
      cards: Array.isArray(asRecord(payload)?.cards)
        ? asRecord(payload)?.cards
        : current.brandShowcase.cards,
    }),
  })

  return storefrontBrandShowcaseSchema.parse(nextSettings.brandShowcase)
}

export async function getStorefrontCampaign(
  database: Kysely<unknown>
) {
  const settings = await getStorefrontSettings(database)

  return storefrontCampaignSectionSchema.parse({
    visibility: {
      cta: settings.visibility.cta,
      trust: settings.visibility.trust,
    },
    campaign: settings.sections.cta,
    trustNotes: settings.trustNotes,
    design: settings.campaignDesign,
  })
}

export async function saveStorefrontCampaign(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontSettings(database)
  const payloadRecord = asRecord(payload)
  const parsedPayload = storefrontCampaignSectionSchema.parse({
    visibility: {
      cta: current.visibility.cta,
      trust: current.visibility.trust,
      ...(asRecord(payloadRecord?.visibility) ?? {}),
    },
    campaign: {
      ...current.sections.cta,
      ...(asRecord(payloadRecord?.campaign) ?? {}),
    },
    trustNotes: Array.isArray(payloadRecord?.trustNotes)
      ? payloadRecord.trustNotes
      : current.trustNotes,
    design: {
      ...current.campaignDesign,
      ...(asRecord(payloadRecord?.design) ?? {}),
    },
  })

  const nextSettings = await saveStorefrontSettings(database, {
    visibility: parsedPayload.visibility,
    sections: {
      cta: parsedPayload.campaign,
    },
    trustNotes: parsedPayload.trustNotes,
    campaignDesign: parsedPayload.design,
  })

  return storefrontCampaignSectionSchema.parse({
    visibility: {
      cta: nextSettings.visibility.cta,
      trust: nextSettings.visibility.trust,
    },
    campaign: nextSettings.sections.cta,
    trustNotes: nextSettings.trustNotes,
    design: nextSettings.campaignDesign,
  })
}
