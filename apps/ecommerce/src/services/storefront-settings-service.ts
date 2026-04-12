import type { Kysely } from "kysely"

import {
  getFirstJsonStorePayload,
  listJsonStorePayloads,
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
  storefrontSettingsRollbackPayloadSchema,
  storefrontSettingsRevisionSchema,
  storefrontSettingsVersionHistoryResponseSchema,
  storefrontSettingsWorkflowStatusSchema,
  storefrontHomeSliderSchema,
  storefrontHomeSliderSlideSchema,
  storefrontHomeSliderThemeSchema,
  type StorefrontHomeSlider,
  type StorefrontHomeSliderSlide,
  type StorefrontHomeSliderTheme,
  type StorefrontSettings,
  type StorefrontSettingsRevision,
  type StorefrontSettingsVersionHistoryEntry,
  type StorefrontSettingsVersionHistoryResponse,
  type StorefrontSettingsWorkflowStatus,
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

const storefrontSettingsRevisionRetentionLimit = 25

async function writeStorefrontSettingsRevision(
  database: Kysely<unknown>,
  settings: StorefrontSettings,
  timestamp: string,
  source: StorefrontSettingsRevision["source"] = "live-save"
) {
  const existing = await listJsonStorePayloads<StorefrontSettingsRevision>(
    database,
    ecommerceTableNames.storefrontSettingsRevisions
  )

  const nextRevision = storefrontSettingsRevisionSchema.parse({
    id: `${settings.id}:${timestamp}`,
    settingsId: settings.id,
    source,
    snapshot: settings,
    snapshotUpdatedAt: settings.updatedAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  const revisions = [
    nextRevision,
    ...existing.filter((item) => item.snapshotUpdatedAt !== settings.updatedAt),
  ].slice(0, storefrontSettingsRevisionRetentionLimit)

  await replaceJsonStoreRecords(
    database,
    ecommerceTableNames.storefrontSettingsRevisions,
    revisions.map((revision, index) => ({
      id: revision.id,
      sortOrder: index + 1,
      payload: revision,
      createdAt: revision.createdAt,
      updatedAt: revision.updatedAt,
    }))
  )
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
  timestamp?: string
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
  const menuDesignerRecord = asRecord(payloadRecord.menuDesigner)
  const topMenuRecord = asRecord(menuDesignerRecord?.topMenu)
  const footerMenuRecord = asRecord(menuDesignerRecord?.footerMenu)
  const appMenuRecord = asRecord(menuDesignerRecord?.appMenu)
  const globalLoaderRecord = asRecord(menuDesignerRecord?.globalLoader)
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

  const createdAt =
    typeof payloadRecord.createdAt === "string" && payloadRecord.createdAt.trim().length > 0
      ? payloadRecord.createdAt
      : base.createdAt
  const updatedAt =
    typeof timestamp === "string" && timestamp.trim().length > 0
      ? timestamp
      : typeof payloadRecord.updatedAt === "string" && payloadRecord.updatedAt.trim().length > 0
        ? payloadRecord.updatedAt
        : base.updatedAt

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
    menuDesigner: menuDesignerRecord
      ? {
          topMenu: topMenuRecord
            ? {
                ...base.menuDesigner.topMenu,
                ...topMenuRecord,
              }
            : base.menuDesigner.topMenu,
          footerMenu: footerMenuRecord
            ? {
                ...base.menuDesigner.footerMenu,
                ...footerMenuRecord,
              }
            : base.menuDesigner.footerMenu,
          appMenu: appMenuRecord
            ? {
                ...base.menuDesigner.appMenu,
                ...appMenuRecord,
              }
            : base.menuDesigner.appMenu,
          globalLoader: globalLoaderRecord
            ? {
                ...base.menuDesigner.globalLoader,
                ...globalLoaderRecord,
              }
            : base.menuDesigner.globalLoader,
        }
      : base.menuDesigner,
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
    createdAt,
    updatedAt,
  })
}

async function readStoredStorefrontSettings(
  database: Kysely<unknown>,
  tableName: string
) {
  return getFirstJsonStorePayload<StorefrontSettings>(database, tableName)
}

async function writeStoredStorefrontSettings(
  database: Kysely<unknown>,
  tableName: string,
  settings: StorefrontSettings | null
) {
  await replaceJsonStoreRecords(
    database,
    tableName,
    settings
      ? [
          {
            id: settings.id,
            payload: settings,
            createdAt: settings.createdAt,
            updatedAt: settings.updatedAt,
          },
        ]
      : []
  )
}

async function getDraftStorefrontSettings(
  database: Kysely<unknown>
): Promise<StorefrontSettings | null> {
  const stored = await readStoredStorefrontSettings(
    database,
    ecommerceTableNames.storefrontSettingsDrafts
  )

  return stored ? buildMergedStorefrontSettings(defaultStorefrontSettings, stored) : null
}

async function getStorefrontSettingsRevisions(
  database: Kysely<unknown>
): Promise<StorefrontSettingsRevision[]> {
  const storedRevisions = await listJsonStorePayloads<StorefrontSettingsRevision>(
    database,
    ecommerceTableNames.storefrontSettingsRevisions
  )

  return storedRevisions.map((revision) =>
    storefrontSettingsRevisionSchema.parse({
      ...revision,
      snapshot: buildMergedStorefrontSettings(defaultStorefrontSettings, revision.snapshot),
    })
  )
}

function buildVersionHistoryEntries<TValue>(
  scope: StorefrontSettingsVersionHistoryEntry["scope"],
  currentLive: StorefrontSettings,
  revisions: StorefrontSettingsRevision[],
  selector: (settings: StorefrontSettings) => TValue,
  summary: (settings: StorefrontSettings) => string
) {
  const entries: StorefrontSettingsVersionHistoryEntry[] = []
  const currentValue = selector(currentLive)
  let previousValue = JSON.stringify(currentValue)

  entries.push({
    id: `${scope}:current:${currentLive.updatedAt}`,
    scope,
    source: "current_live",
    revisionId: null,
    snapshotUpdatedAt: currentLive.updatedAt,
    createdAt: currentLive.updatedAt,
    summary: summary(currentLive),
  })

  for (const revision of revisions) {
    const revisionValue = JSON.stringify(selector(revision.snapshot))

    if (revisionValue === previousValue) {
      continue
    }

    previousValue = revisionValue
    entries.push({
      id: `${scope}:${revision.id}`,
      scope,
      source: revision.source,
      revisionId: revision.id,
      snapshotUpdatedAt: revision.snapshotUpdatedAt,
      createdAt: revision.createdAt,
      summary: summary(revision.snapshot),
    })
  }

  return entries
}

async function replaceLiveStorefrontSettings(
  database: Kysely<unknown>,
  payload: unknown,
  options: {
    revisionSource?: StorefrontSettingsRevision["source"]
  } = {}
): Promise<StorefrontSettings> {
  const current = await getStorefrontDesignerSettings(database)
  const timestamp = new Date().toISOString()
  const nextSettings = buildMergedStorefrontSettings(current, payload, timestamp)

  await writeStorefrontSettingsRevision(
    database,
    current,
    timestamp,
    options.revisionSource ?? "live-save"
  )

  await writeStoredStorefrontSettings(
    database,
    ecommerceTableNames.storefrontSettings,
    nextSettings
  )

  return nextSettings
}

async function replaceDraftStorefrontSettings(
  database: Kysely<unknown>,
  payload: unknown
): Promise<StorefrontSettings> {
  const current = (await getDraftStorefrontSettings(database)) ?? (await getStorefrontSettings(database))
  const timestamp = new Date().toISOString()
  const nextSettings = buildMergedStorefrontSettings(current, payload, timestamp)

  await writeStoredStorefrontSettings(
    database,
    ecommerceTableNames.storefrontSettingsDrafts,
    nextSettings
  )

  return nextSettings
}

export async function getStorefrontDesignerSettings(
  database: Kysely<unknown>
): Promise<StorefrontSettings> {
  return (await getDraftStorefrontSettings(database)) ?? getStorefrontSettings(database)
}

export async function getStorefrontSettingsWorkflowStatus(
  database: Kysely<unknown>
): Promise<StorefrontSettingsWorkflowStatus> {
  const [liveSettings, draftSettings, revisions] = await Promise.all([
    getStorefrontSettings(database),
    getDraftStorefrontSettings(database),
    getStorefrontSettingsRevisions(database),
  ])

  return storefrontSettingsWorkflowStatusSchema.parse({
    liveSettings,
    draftSettings,
    previewSettings: draftSettings ?? liveSettings,
    revisions,
    hasDraft: draftSettings != null,
    hasUnpublishedChanges:
      draftSettings != null && JSON.stringify(draftSettings) !== JSON.stringify(liveSettings),
  })
}

export async function getStorefrontSettingsVersionHistory(
  database: Kysely<unknown>
): Promise<StorefrontSettingsVersionHistoryResponse> {
  const [liveSettings, revisions] = await Promise.all([
    getStorefrontSettings(database),
    getStorefrontSettingsRevisions(database),
  ])

  return storefrontSettingsVersionHistoryResponseSchema.parse({
    settings: buildVersionHistoryEntries(
      "settings",
      liveSettings,
      revisions,
      (settings) => settings,
      (settings) => settings.announcement
    ),
    homeSlider: buildVersionHistoryEntries(
      "home_slider",
      liveSettings,
      revisions,
      (settings) => settings.homeSlider,
      (settings) => `${settings.homeSlider.slides.length} slider themes`
    ),
    footer: buildVersionHistoryEntries(
      "footer",
      liveSettings,
      revisions,
      (settings) => settings.footer,
      (settings) => settings.footer.description
    ),
    campaign: buildVersionHistoryEntries(
      "campaign",
      liveSettings,
      revisions,
      (settings) => ({
        visibility: {
          cta: settings.visibility.cta,
          trust: settings.visibility.trust,
        },
        cta: settings.sections.cta,
        trustNotes: settings.trustNotes,
        design: settings.campaignDesign,
      }),
      (settings) => settings.sections.cta.title
    ),
  })
}

export async function getStorefrontSettings(
  database: Kysely<unknown>
): Promise<StorefrontSettings> {
  const stored = await readStoredStorefrontSettings(
    database,
    ecommerceTableNames.storefrontSettings
  )

  return buildMergedStorefrontSettings(defaultStorefrontSettings, stored ?? {})
}

export async function saveStorefrontSettings(
  database: Kysely<unknown>,
  payload: unknown
): Promise<StorefrontSettings> {
  return replaceDraftStorefrontSettings(database, payload)
}

export async function publishStorefrontSettingsDraft(
  database: Kysely<unknown>
): Promise<StorefrontSettingsWorkflowStatus> {
  const draftSettings = await getDraftStorefrontSettings(database)

  if (!draftSettings) {
    return getStorefrontSettingsWorkflowStatus(database)
  }

  await replaceLiveStorefrontSettings(database, draftSettings, {
    revisionSource: "publish",
  })
  await writeStoredStorefrontSettings(
    database,
    ecommerceTableNames.storefrontSettingsDrafts,
    null
  )

  return getStorefrontSettingsWorkflowStatus(database)
}

export async function rollbackStorefrontSettings(
  database: Kysely<unknown>,
  payload: unknown
): Promise<StorefrontSettingsWorkflowStatus> {
  const input = storefrontSettingsRollbackPayloadSchema.parse(payload ?? {})
  const revisions = await getStorefrontSettingsRevisions(database)
  const targetRevision =
    (input.revisionId
      ? revisions.find((revision) => revision.id === input.revisionId)
      : revisions[0]) ?? null

  if (!targetRevision) {
    throw new Error("No storefront revision is available for rollback.")
  }

  await replaceLiveStorefrontSettings(database, targetRevision.snapshot, {
    revisionSource: "rollback",
  })
  await writeStoredStorefrontSettings(
    database,
    ecommerceTableNames.storefrontSettingsDrafts,
    null
  )

  return getStorefrontSettingsWorkflowStatus(database)
}

export async function getStorefrontHomeSlider(
  database: Kysely<unknown>
): Promise<StorefrontHomeSlider> {
  const settings = await getStorefrontDesignerSettings(database)
  return storefrontHomeSliderSchema.parse(settings.homeSlider)
}

export async function saveStorefrontHomeSlider(
  database: Kysely<unknown>,
  payload: unknown
): Promise<StorefrontHomeSlider> {
  const current = await getStorefrontDesignerSettings(database)
  const parsedPayload = buildMergedHomeSlider(current.homeSlider, payload)

  const nextSettings = await saveStorefrontSettings(database, {
    homeSlider: parsedPayload,
  })

  return storefrontHomeSliderSchema.parse(nextSettings.homeSlider)
}

export async function getStorefrontFooter(
  database: Kysely<unknown>
) {
  const settings = await getStorefrontDesignerSettings(database)
  return storefrontFooterSchema.parse(settings.footer)
}

export async function saveStorefrontFooter(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontDesignerSettings(database)
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
  const settings = await getStorefrontDesignerSettings(database)
  return storefrontFloatingContactSchema.parse(settings.floatingContact)
}

export async function saveStorefrontFloatingContact(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontDesignerSettings(database)
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
  const settings = await getStorefrontDesignerSettings(database)
  return storefrontPickupLocationSchema.parse(settings.pickupLocation)
}

export async function saveStorefrontPickupLocation(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontDesignerSettings(database)
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
  const settings = await getStorefrontDesignerSettings(database)
  return storefrontCouponBannerSchema.parse(settings.couponBanner)
}

export async function saveStorefrontCouponBanner(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontDesignerSettings(database)
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
  const settings = await getStorefrontDesignerSettings(database)
  return storefrontGiftCornerSchema.parse(settings.giftCorner)
}

export async function saveStorefrontGiftCorner(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontDesignerSettings(database)
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
  const settings = await getStorefrontDesignerSettings(database)
  return storefrontTrendingSectionSchema.parse(settings.trendingSection)
}

export async function saveStorefrontTrendingSection(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontDesignerSettings(database)
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
  const settings = await getStorefrontDesignerSettings(database)
  return storefrontBrandShowcaseSchema.parse(settings.brandShowcase)
}

export async function saveStorefrontBrandShowcase(
  database: Kysely<unknown>,
  payload: unknown
) {
  const current = await getStorefrontDesignerSettings(database)
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
  const settings = await getStorefrontDesignerSettings(database)

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
  const current = await getStorefrontDesignerSettings(database)
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
