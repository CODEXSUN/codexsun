import { z } from "zod"

const hexColorSchema = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i)

function isValidStorefrontLink(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return false
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return true
  }

  try {
    const parsed = new URL(trimmed)
    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "mailto:" ||
      parsed.protocol === "tel:"
    )
  } catch {
    return false
  }
}

function isValidStorefrontMediaReference(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return false
  }

  if (trimmed.startsWith("/")) {
    return true
  }

  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const storefrontLinkSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isValidStorefrontLink, {
    message: "Link must be a relative path, anchor, or valid http/mailto/tel URL.",
  })

const storefrontOptionalLinkSchema = storefrontLinkSchema.nullable().default(null)

const storefrontMediaReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isValidStorefrontMediaReference, {
    message: "Media reference must be a root-relative asset path or valid http/https URL.",
  })

export const storefrontHighlightSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
})

export const storefrontSearchDepartmentSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
})

export const storefrontCatalogIntroSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
})

export const storefrontSearchSchema = z.object({
  catalogIntro: storefrontCatalogIntroSchema,
  placeholder: z.string().min(1),
  departmentLabel: z.string().min(1),
  categoryFilterLabel: z.string().min(1),
  departmentFilterLabel: z.string().min(1),
  sortFilterLabel: z.string().min(1),
  resetLabel: z.string().min(1),
  resultsLabel: z.string().min(1),
  departments: z.array(storefrontSearchDepartmentSchema).min(1),
})

export const storefrontAnnouncementDesignSchema = z.object({
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  iconColor: hexColorSchema,
  iconKey: z.enum(["sparkles", "truck", "shield"]),
  cornerStyle: z.enum(["pill", "rounded", "soft"]),
})

export const storefrontAnnouncementItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  href: storefrontOptionalLinkSchema,
})

export const storefrontHeroSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  primaryCtaLabel: z.string().min(1),
  primaryCtaHref: storefrontLinkSchema,
  secondaryCtaLabel: z.string().min(1),
  secondaryCtaHref: storefrontLinkSchema,
  heroImageUrl: storefrontMediaReferenceSchema,
  highlights: z.array(storefrontHighlightSchema).min(1),
})

export const storefrontHomeSliderThemeSchema = z.object({
  themeKey: z.string().min(1),
  backgroundFrom: hexColorSchema,
  backgroundVia: hexColorSchema,
  backgroundTo: hexColorSchema,
  textColor: hexColorSchema.nullable(),
  mutedTextColor: hexColorSchema.nullable(),
  badgeBackground: hexColorSchema.nullable(),
  badgeTextColor: hexColorSchema.nullable(),
  primaryButtonLabel: z.string().min(1).nullable(),
  secondaryButtonLabel: z.string().min(1).nullable(),
  primaryButtonBackground: hexColorSchema.nullable(),
  primaryButtonTextColor: hexColorSchema.nullable(),
  secondaryButtonBackground: hexColorSchema.nullable(),
  secondaryButtonTextColor: hexColorSchema.nullable(),
  navBackground: hexColorSchema.nullable(),
  navTextColor: hexColorSchema.nullable(),
  frameBackground: hexColorSchema.nullable(),
  outerFrameBorderColor: hexColorSchema.nullable(),
  innerFrameBorderColor: hexColorSchema.nullable(),
  imagePanelBackground: hexColorSchema.nullable(),
})

export const storefrontHomeSliderSlideSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  theme: storefrontHomeSliderThemeSchema,
})

export const storefrontHomeSliderSchema = z.object({
  slides: z.array(storefrontHomeSliderSlideSchema).min(1),
})

export const storefrontSectionCopySchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  ctaLabel: z.string().min(1).nullable(),
  ctaHref: storefrontLinkSchema.nullable(),
  cardsPerRow: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).default(3),
})

export const storefrontProductLaneSectionSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  ctaLabel: z.string().min(1).nullable(),
  ctaHref: storefrontLinkSchema.nullable(),
  cardsPerRow: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(3),
  rowsToShow: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
})

export const storefrontFeaturedCardDesignSchema = z.object({
  titleColor: hexColorSchema,
  metaColor: hexColorSchema,
  descriptionColor: hexColorSchema,
  priceColor: hexColorSchema,
  compareAtColor: hexColorSchema,
  badgeBackgroundColor: hexColorSchema,
  badgeTextColor: hexColorSchema,
  secondaryBadgeText: z.string().min(1),
  secondaryBadgeBackgroundColor: hexColorSchema,
  secondaryBadgeTextColor: hexColorSchema,
  primaryButtonLabel: z.string().min(1),
  showPrimaryBadge: z.boolean().default(true),
  showSecondaryBadge: z.boolean().default(true),
  showBrandMeta: z.boolean().default(true),
  showCategoryMeta: z.boolean().default(true),
  showStockMeta: z.boolean().default(true),
  showDescription: z.boolean().default(true),
  showCompareAtPrice: z.boolean().default(true),
  showPrimaryAction: z.boolean().default(true),
  showSecondaryActions: z.boolean().default(true),
})

export const storefrontCategoryCardDesignSchema = z.object({
  titleColor: hexColorSchema,
  metaColor: hexColorSchema,
  descriptionColor: hexColorSchema,
  buttonLabel: z.string().min(1),
  buttonBackgroundColor: hexColorSchema,
  buttonTextColor: hexColorSchema,
  showProductCount: z.boolean().default(true),
  showDescription: z.boolean().default(true),
  showAction: z.boolean().default(true),
})

export const storefrontFeaturedSectionSchema = storefrontSectionCopySchema.extend({
  cardsPerRow: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).default(4),
  rowsToShow: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  cardDesign: storefrontFeaturedCardDesignSchema,
})

export const storefrontCategorySectionSchema = storefrontSectionCopySchema.extend({
  rowsToShow: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  cardDesign: storefrontCategoryCardDesignSchema,
})

export const storefrontPromoSectionSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  primaryCtaLabel: z.string().min(1),
  primaryCtaHref: storefrontLinkSchema,
  secondaryCtaLabel: z.string().min(1),
  secondaryCtaHref: storefrontLinkSchema,
})

export const storefrontTrustNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  iconKey: z.enum(["sparkles", "truck", "shield"]),
})

export const storefrontCampaignDesignSchema = z.object({
  campaignBackgroundFrom: hexColorSchema,
  campaignBackgroundTo: hexColorSchema,
  campaignBorderColor: hexColorSchema,
  campaignEyebrowColor: hexColorSchema,
  campaignTitleColor: hexColorSchema,
  campaignSummaryColor: hexColorSchema,
  primaryButtonBackgroundColor: hexColorSchema,
  primaryButtonTextColor: hexColorSchema,
  primaryButtonBorderColor: hexColorSchema,
  secondaryButtonBackgroundColor: hexColorSchema,
  secondaryButtonTextColor: hexColorSchema,
  secondaryButtonBorderColor: hexColorSchema,
  trustCardBackgroundColor: hexColorSchema,
  trustCardBorderColor: hexColorSchema,
  trustCardHoverBorderColor: hexColorSchema,
  trustIconBackgroundColor: hexColorSchema,
  trustIconColor: hexColorSchema,
  trustIconHoverBackgroundColor: hexColorSchema,
  trustIconHoverColor: hexColorSchema,
  trustTitleColor: hexColorSchema,
  trustTitleHoverColor: hexColorSchema,
  trustSummaryColor: hexColorSchema,
  trustSummaryHoverColor: hexColorSchema,
})

export const storefrontVisibilitySchema = z.object({
  announcement: z.boolean().default(true),
  hero: z.boolean().default(true),
  search: z.boolean().default(true),
  support: z.boolean().default(true),
  featured: z.boolean().default(true),
  categories: z.boolean().default(true),
  newArrivals: z.boolean().default(true),
  bestSellers: z.boolean().default(true),
  cta: z.boolean().default(true),
  trust: z.boolean().default(true),
})

export const storefrontFooterLinkSchema = z.object({
  label: z.string().min(1),
  href: storefrontLinkSchema,
})

export const storefrontFooterSocialLinkSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: storefrontLinkSchema,
  platform: z
    .enum([
      "facebook",
      "instagram",
      "twitter",
      "youtube",
      "website",
      "linkedin",
      "github",
      "discord",
      "whatsapp",
      "telegram",
    ])
    .default("website"),
})

export const storefrontFooterDesignSchema = z.object({
  backgroundColor: hexColorSchema,
  borderColor: hexColorSchema,
  titleColor: hexColorSchema,
  bodyTextColor: hexColorSchema,
  mutedTextColor: hexColorSchema,
  logoBackgroundColor: hexColorSchema,
  socialButtonBackgroundColor: hexColorSchema,
  socialButtonBorderColor: hexColorSchema,
  socialButtonIconColor: hexColorSchema,
  socialButtonHoverBackgroundColor: hexColorSchema,
  socialButtonHoverIconColor: hexColorSchema,
})

export const storefrontMenuSurfaceDesignSchema = z.object({
  logoVariant: z.enum(["primary", "dark"]).default("primary"),
  frameWidth: z.number().int().min(48).max(640).default(180),
  frameHeight: z.number().int().min(40).max(240).default(72),
  logoWidth: z.number().int().min(16).max(480).default(84),
  logoHeight: z.number().int().min(16).max(240).default(48),
  offsetX: z.number().int().min(-320).max(320).default(0),
  offsetY: z.number().int().min(-160).max(160).default(0),
  logoHoverColor: hexColorSchema,
  areaBackgroundColor: hexColorSchema,
  logoBackgroundColor: hexColorSchema,
})

export const storefrontMenuDesignerSchema = z.object({
  topMenu: storefrontMenuSurfaceDesignSchema,
  footerMenu: storefrontMenuSurfaceDesignSchema,
  appMenu: storefrontMenuSurfaceDesignSchema,
  globalLoader: storefrontMenuSurfaceDesignSchema,
})

export const storefrontFooterGroupSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  links: z.array(storefrontFooterLinkSchema).min(1),
})

export const storefrontFooterSchema = z.object({
  description: z.string().min(1),
  legalLine: z.string().min(1),
  socialLinks: z.array(storefrontFooterSocialLinkSchema).default([]),
  design: storefrontFooterDesignSchema,
  groups: z.array(storefrontFooterGroupSchema).min(1),
})

export const storefrontFloatingContactSchema = z.object({
  enabled: z.boolean().default(true),
  icon: z.enum(["contact", "message", "phone", "mail"]).default("contact"),
  email: z.string().trim().nullable().default(null),
  phone: z.string().trim().nullable().default(null),
  showWhatsApp: z.boolean().default(true),
  showPhone: z.boolean().default(true),
  showEmail: z.boolean().default(true),
  buttonLabel: z.string().min(1),
  whatsappLabel: z.string().min(1),
  phoneLabel: z.string().min(1),
  emailLabel: z.string().min(1),
  whatsappMessage: z.string().min(1),
  buttonBackgroundColor: hexColorSchema,
  buttonHoverBackgroundColor: hexColorSchema,
  buttonTextColor: hexColorSchema,
  buttonBorderColor: hexColorSchema,
  buttonRingColor: hexColorSchema,
  actionBackgroundColor: hexColorSchema,
  actionBorderColor: hexColorSchema,
  actionTextColor: hexColorSchema,
  actionIconColor: hexColorSchema,
})

export const storefrontPickupLocationSchema = z.object({
  enabled: z.boolean().default(false),
  title: z.string().min(1),
  summary: z.string().min(1),
  storeName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().nullable().default(null),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  pincode: z.string().min(1),
  contactPhone: z.string().min(1),
  contactEmail: z.email(),
  pickupNote: z.string().min(1),
})

export const storefrontShippingMethodSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  courierName: z.string().trim().min(1).nullable().default(null),
  serviceLevel: z.string().min(1),
  etaMinDays: z.number().int().min(0),
  etaMaxDays: z.number().int().min(0),
  shippingAmount: z.number().finite().nonnegative(),
  handlingAmount: z.number().finite().nonnegative(),
  freeShippingThreshold: z.number().finite().nonnegative().nullable().default(null),
  codEligible: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export const storefrontShippingZoneSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  countries: z.array(z.string().min(1)).default([]),
  states: z.array(z.string().min(1)).default([]),
  pincodePrefixes: z.array(z.string().min(1)).default([]),
  shippingSurchargeAmount: z.number().finite().nonnegative(),
  handlingSurchargeAmount: z.number().finite().nonnegative(),
  freeShippingThresholdOverride: z.number().finite().nonnegative().nullable().default(null),
  etaAdditionalDays: z.number().int().min(0),
  codEligible: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export const storefrontCouponBannerSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  couponCode: z.string().min(1),
  buttonLabel: z.string().min(1),
  buttonHref: storefrontOptionalLinkSchema,
  helperText: z.string().min(1),
  backgroundColor: hexColorSchema,
  borderColor: hexColorSchema,
  eyebrowColor: hexColorSchema,
  titleColor: hexColorSchema,
  summaryColor: hexColorSchema,
  codeBackgroundColor: hexColorSchema,
  codeTextColor: hexColorSchema,
  buttonBackgroundColor: hexColorSchema,
  buttonTextColor: hexColorSchema,
  accentColor: hexColorSchema,
})

export const storefrontGiftCornerSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  buttonLabel: z.string().min(1),
  buttonHref: storefrontOptionalLinkSchema,
  imageUrl: storefrontMediaReferenceSchema,
  backgroundFrom: hexColorSchema,
  backgroundTo: hexColorSchema,
  eyebrowColor: hexColorSchema,
  titleColor: hexColorSchema,
  summaryColor: hexColorSchema,
  buttonBackgroundColor: hexColorSchema,
  buttonIconColor: hexColorSchema,
  imageFrameBackgroundColor: hexColorSchema,
  imageFrameAccentColor: hexColorSchema,
  ribbonColor: hexColorSchema,
  ribbonDetailColor: hexColorSchema,
})

export const storefrontTrendingCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  caption: z.string().min(1),
  href: storefrontOptionalLinkSchema,
  imageUrl: storefrontMediaReferenceSchema,
  backgroundColor: hexColorSchema,
  titleColor: hexColorSchema,
  captionBackgroundColor: hexColorSchema,
  captionTextColor: hexColorSchema,
})

export const storefrontTrendingSectionSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().min(1),
  description: z.string().min(1),
  featureTitle: z.string().min(1),
  featureSummary: z.string().min(1),
  featureImageUrl: storefrontMediaReferenceSchema,
  featureHref: storefrontOptionalLinkSchema,
  featureBackgroundColor: hexColorSchema,
  featureTextColor: hexColorSchema,
  cards: z.array(storefrontTrendingCardSchema).min(1),
})

export const storefrontDiscoveryBoardCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  href: storefrontOptionalLinkSchema,
  images: z.array(storefrontMediaReferenceSchema).min(4).max(4),
})

export const storefrontDiscoveryBoardSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().min(1),
  summary: z.string().min(1).nullable().default(null),
  cards: z.array(storefrontDiscoveryBoardCardSchema).min(1).max(8),
})

export const storefrontVisualStripCardSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: storefrontOptionalLinkSchema,
  imageUrl: storefrontMediaReferenceSchema,
})

export const storefrontVisualStripSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().min(1),
  ctaLabel: z.string().min(1).nullable().default(null),
  ctaHref: storefrontOptionalLinkSchema,
  cards: z.array(storefrontVisualStripCardSchema).min(1),
})

export const storefrontProductCardSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brandName: z.string().nullable(),
  categoryName: z.string().nullable(),
  department: z.string().nullable(),
  badge: z.string().nullable(),
  promoBadge: z.string().nullable().default(null),
  promoTitle: z.string().nullable().default(null),
  promoSubtitle: z.string().nullable().default(null),
  promoCtaLabel: z.string().nullable().default(null),
  shortDescription: z.string().nullable(),
  primaryImageUrl: z.string().nullable(),
  sellingPrice: z.number().finite(),
  mrp: z.number().finite(),
  discountPercent: z.number().int().min(0),
  promoSliderEnabled: z.boolean().default(false),
  isNewArrival: z.boolean(),
  isBestSeller: z.boolean(),
  isFeaturedLabel: z.boolean(),
  shippingCharge: z.number().finite().nonnegative().nullable().default(null),
  handlingCharge: z.number().finite().nonnegative().nullable().default(null),
  availableQuantity: z.number().int().min(0),
  tagNames: z.array(z.string().min(1)),
})

export const storefrontRecommendationReasonSchema = z.enum([
  "search_match",
  "category_affinity",
  "brand_affinity",
  "tag_affinity",
  "wishlist_affinity",
  "repeat_order_affinity",
  "new_arrival",
  "best_seller",
])

export const storefrontRecommendationItemSchema = storefrontProductCardSchema.extend({
  reason: storefrontRecommendationReasonSchema,
  score: z.number().finite().nonnegative(),
})

export const storefrontCategorySummarySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  showInTopMenu: z.boolean(),
  positionOrder: z.number().int(),
  productCount: z.number().int().min(0),
  href: storefrontLinkSchema,
})

export const storefrontBrandDiscoveryCardSchema = z.object({
  id: z.string().min(1),
  brandName: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  imageUrl: storefrontMediaReferenceSchema,
  href: storefrontLinkSchema,
})

export const storefrontBrandShowcaseSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().min(1),
  description: z.string().min(1),
  cards: z.array(storefrontBrandDiscoveryCardSchema).min(1),
})

export const storefrontCampaignSectionSchema = z.object({
  visibility: z.object({
    cta: z.boolean().default(true),
    trust: z.boolean().default(true),
  }),
  campaign: storefrontPromoSectionSchema,
  trustNotes: z.array(storefrontTrustNoteSchema).min(1),
  design: storefrontCampaignDesignSchema,
})

export const storefrontLegalPageSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1).nullable().default(null),
  body: z.array(z.string().min(1)).min(1),
})

export const storefrontLegalPageFaqSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
})

export const storefrontLegalPageSchema = z.object({
  id: z.enum(["shipping", "returns", "privacy", "terms", "contact"]),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  supportLabel: z.string().min(1).nullable().default(null),
  sections: z.array(storefrontLegalPageSectionSchema).min(1),
  faqs: z.array(storefrontLegalPageFaqSchema).default([]),
})

export const storefrontLegalPagesSchema = z.object({
  shipping: storefrontLegalPageSchema,
  returns: storefrontLegalPageSchema,
  privacy: storefrontLegalPageSchema,
  terms: storefrontLegalPageSchema,
  contact: storefrontLegalPageSchema,
})

export const storefrontSettingsSchema = z.object({
  id: z.string().min(1),
  visibility: storefrontVisibilitySchema,
  hero: storefrontHeroSchema,
  homeSlider: storefrontHomeSliderSchema,
  search: storefrontSearchSchema,
  announcementDesign: storefrontAnnouncementDesignSchema,
  announcementItems: z.array(storefrontAnnouncementItemSchema).min(1),
  sections: z.object({
    featured: storefrontFeaturedSectionSchema,
    categories: storefrontCategorySectionSchema,
    newArrivals: storefrontProductLaneSectionSchema,
    bestSellers: storefrontProductLaneSectionSchema,
    cta: storefrontPromoSectionSchema,
  }),
  trustNotes: z.array(storefrontTrustNoteSchema).min(1),
  footer: storefrontFooterSchema,
  menuDesigner: storefrontMenuDesignerSchema,
  floatingContact: storefrontFloatingContactSchema,
  pickupLocation: storefrontPickupLocationSchema,
  shippingMethods: z.array(storefrontShippingMethodSchema).min(1),
  shippingZones: z.array(storefrontShippingZoneSchema).min(1),
  couponBanner: storefrontCouponBannerSchema,
  giftCorner: storefrontGiftCornerSchema,
  trendingSection: storefrontTrendingSectionSchema,
  discoveryBoard: storefrontDiscoveryBoardSchema,
  visualStrip: storefrontVisualStripSchema,
  brandShowcase: storefrontBrandShowcaseSchema,
  campaignDesign: storefrontCampaignDesignSchema,
  legalPages: storefrontLegalPagesSchema,
  announcement: z.string().min(1),
  supportPhone: z.string().min(1),
  supportEmail: z.email(),
  freeShippingThreshold: z.number().finite().nonnegative(),
  defaultShippingAmount: z.number().finite().nonnegative(),
  defaultHandlingAmount: z.number().finite().nonnegative(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontSettingsRevisionSchema = z.object({
  id: z.string().min(1),
  settingsId: z.string().min(1),
  source: z.enum(["live-save", "publish", "rollback"]),
  snapshot: storefrontSettingsSchema,
  snapshotUpdatedAt: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontSettingsWorkflowStatusSchema = z.object({
  liveSettings: storefrontSettingsSchema,
  draftSettings: storefrontSettingsSchema.nullable(),
  previewSettings: storefrontSettingsSchema,
  revisions: z.array(storefrontSettingsRevisionSchema),
  hasDraft: z.boolean(),
  hasUnpublishedChanges: z.boolean(),
})

export const storefrontSettingsRollbackPayloadSchema = z.object({
  revisionId: z.string().min(1).nullable().default(null),
})

export const storefrontSettingsVersionHistoryEntrySchema = z.object({
  id: z.string().min(1),
  scope: z.enum(["settings", "home_slider", "footer", "campaign"]),
  source: z.enum(["live-save", "publish", "rollback", "current_live"]),
  revisionId: z.string().min(1).nullable().default(null),
  snapshotUpdatedAt: z.string().min(1),
  createdAt: z.string().min(1),
  summary: z.string().min(1),
})

export const storefrontSettingsVersionHistoryResponseSchema = z.object({
  settings: z.array(storefrontSettingsVersionHistoryEntrySchema),
  homeSlider: z.array(storefrontSettingsVersionHistoryEntrySchema),
  footer: z.array(storefrontSettingsVersionHistoryEntrySchema),
  campaign: z.array(storefrontSettingsVersionHistoryEntrySchema),
})

export const storefrontLandingResponseSchema = z.object({
  settings: storefrontSettingsSchema,
  featured: z.array(storefrontProductCardSchema),
  newArrivals: z.array(storefrontProductCardSchema),
  bestSellers: z.array(storefrontProductCardSchema),
  categories: z.array(storefrontCategorySummarySchema),
  brands: z.array(storefrontBrandDiscoveryCardSchema),
})

export const storefrontCatalogQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  department: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  sort: z.enum(["featured", "latest", "price-asc", "price-desc"]).optional(),
})

export const storefrontCatalogResponseSchema = z.object({
  settings: storefrontSettingsSchema,
  filters: z.object({
    search: z.string().trim().default(""),
    category: z.string().trim().default(""),
    department: z.string().trim().default(""),
    tag: z.string().trim().default(""),
    sort: z.enum(["featured", "latest", "price-asc", "price-desc"]).default("featured"),
  }),
  items: z.array(storefrontProductCardSchema),
  recommendationRail: z.array(storefrontRecommendationItemSchema).default([]),
  availableCategories: z.array(storefrontCategorySummarySchema),
  availableDepartments: z.array(z.string().min(1)),
  availableTags: z.array(z.string().min(1)),
})

export const storefrontProductDetailSchema = storefrontProductCardSchema.extend({
  description: z.string().nullable(),
  images: z.array(z.string().min(1)),
  fits: z.array(z.string().min(1)),
  fabrics: z.array(z.string().min(1)),
  shippingNote: z.string().nullable(),
  reviewCount: z.number().int().min(0),
  averageRating: z.number().finite().min(0).max(5),
  specificationGroups: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      summary: z.string().min(1).nullable().default(null),
      items: z.array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          value: z.string().min(1),
        })
      ),
    })
  ),
})

export const storefrontProductResponseSchema = z.object({
  settings: storefrontSettingsSchema,
  item: storefrontProductDetailSchema,
  relatedItems: z.array(storefrontProductCardSchema),
  recommendedItems: z.array(storefrontRecommendationItemSchema).default([]),
})

export const storefrontRecommendationReportSchema = z.object({
  generatedAt: z.string().min(1),
  searchPreview: z.array(storefrontRecommendationItemSchema),
  productPreview: z.array(storefrontRecommendationItemSchema),
  trendingPreview: z.array(storefrontRecommendationItemSchema),
})

export const storefrontMerchandisingExperimentSurfaceSchema = z.object({
  surfaceKey: z.enum([
    "hero",
    "featured",
    "new_arrivals",
    "best_sellers",
    "coupon_banner",
    "gift_corner",
    "trending",
    "brand_showcase",
    "campaign",
  ]),
  hypothesis: z.string().min(1),
  primaryMetric: z.string().min(1),
  secondaryMetric: z.string().min(1),
  status: z.enum(["ready", "watch", "blocked"]),
})

export const storefrontMerchandisingAutomationReportSchema = z.object({
  generatedAt: z.string().min(1),
  summary: z.object({
    totalActiveProducts: z.number().int().min(0),
    featuredCandidateCount: z.number().int().min(0),
    lowStockFeaturedCount: z.number().int().min(0),
    automationReadyCount: z.number().int().min(0),
    experimentSurfaceCount: z.number().int().min(0),
  }),
  featuredCandidates: z.array(storefrontRecommendationItemSchema),
  lowStockFeaturedItems: z.array(storefrontProductCardSchema),
  staleMerchandisingItems: z.array(storefrontProductCardSchema),
  experimentSurfaces: z.array(storefrontMerchandisingExperimentSurfaceSchema),
})

export const storefrontLegalPageResponseSchema = z.object({
  settings: storefrontSettingsSchema,
  item: storefrontLegalPageSchema,
})

export type StorefrontHero = z.infer<typeof storefrontHeroSchema>
export type StorefrontHomeSliderTheme = z.infer<typeof storefrontHomeSliderThemeSchema>
export type StorefrontHomeSliderSlide = z.infer<typeof storefrontHomeSliderSlideSchema>
export type StorefrontHomeSlider = z.infer<typeof storefrontHomeSliderSchema>
export type StorefrontHighlight = z.infer<typeof storefrontHighlightSchema>
export type StorefrontAnnouncementDesign = z.infer<typeof storefrontAnnouncementDesignSchema>
export type StorefrontAnnouncementItem = z.infer<typeof storefrontAnnouncementItemSchema>
export type StorefrontSearch = z.infer<typeof storefrontSearchSchema>
export type StorefrontSearchDepartment = z.infer<typeof storefrontSearchDepartmentSchema>
export type StorefrontCatalogIntro = z.infer<typeof storefrontCatalogIntroSchema>
export type StorefrontSectionCopy = z.infer<typeof storefrontSectionCopySchema>
export type StorefrontFeaturedCardDesign = z.infer<typeof storefrontFeaturedCardDesignSchema>
export type StorefrontFeaturedSection = z.infer<typeof storefrontFeaturedSectionSchema>
export type StorefrontCategoryCardDesign = z.infer<typeof storefrontCategoryCardDesignSchema>
export type StorefrontCategorySection = z.infer<typeof storefrontCategorySectionSchema>
export type StorefrontPromoSection = z.infer<typeof storefrontPromoSectionSchema>
export type StorefrontTrustNote = z.infer<typeof storefrontTrustNoteSchema>
export type StorefrontCampaignDesign = z.infer<typeof storefrontCampaignDesignSchema>
export type StorefrontVisibility = z.infer<typeof storefrontVisibilitySchema>
export type StorefrontFooter = z.infer<typeof storefrontFooterSchema>
export type StorefrontFooterDesign = z.infer<typeof storefrontFooterDesignSchema>
export type StorefrontFooterGroup = z.infer<typeof storefrontFooterGroupSchema>
export type StorefrontFooterLink = z.infer<typeof storefrontFooterLinkSchema>
export type StorefrontFooterSocialLink = z.infer<typeof storefrontFooterSocialLinkSchema>
export type StorefrontMenuSurfaceDesign = z.infer<typeof storefrontMenuSurfaceDesignSchema>
export type StorefrontMenuDesigner = z.infer<typeof storefrontMenuDesignerSchema>
export type StorefrontFloatingContact = z.infer<typeof storefrontFloatingContactSchema>
export type StorefrontPickupLocation = z.infer<typeof storefrontPickupLocationSchema>
export type StorefrontShippingMethod = z.infer<typeof storefrontShippingMethodSchema>
export type StorefrontShippingZone = z.infer<typeof storefrontShippingZoneSchema>
export type StorefrontCouponBanner = z.infer<typeof storefrontCouponBannerSchema>
export type StorefrontGiftCorner = z.infer<typeof storefrontGiftCornerSchema>
export type StorefrontTrendingCard = z.infer<typeof storefrontTrendingCardSchema>
export type StorefrontTrendingSection = z.infer<typeof storefrontTrendingSectionSchema>
export type StorefrontDiscoveryBoardCard = z.infer<
  typeof storefrontDiscoveryBoardCardSchema
>
export type StorefrontDiscoveryBoard = z.infer<typeof storefrontDiscoveryBoardSchema>
export type StorefrontVisualStripCard = z.infer<typeof storefrontVisualStripCardSchema>
export type StorefrontVisualStrip = z.infer<typeof storefrontVisualStripSchema>
export type StorefrontProductCard = z.infer<typeof storefrontProductCardSchema>
export type StorefrontRecommendationReason = z.infer<
  typeof storefrontRecommendationReasonSchema
>
export type StorefrontRecommendationItem = z.infer<
  typeof storefrontRecommendationItemSchema
>
export type StorefrontCategorySummary = z.infer<typeof storefrontCategorySummarySchema>
export type StorefrontBrandDiscoveryCard = z.infer<typeof storefrontBrandDiscoveryCardSchema>
export type StorefrontBrandShowcase = z.infer<typeof storefrontBrandShowcaseSchema>
export type StorefrontCampaignSection = z.infer<typeof storefrontCampaignSectionSchema>
export type StorefrontLegalPageSection = z.infer<typeof storefrontLegalPageSectionSchema>
export type StorefrontLegalPageFaq = z.infer<typeof storefrontLegalPageFaqSchema>
export type StorefrontLegalPage = z.infer<typeof storefrontLegalPageSchema>
export type StorefrontLegalPages = z.infer<typeof storefrontLegalPagesSchema>
export type StorefrontSettings = z.infer<typeof storefrontSettingsSchema>
export type StorefrontSettingsRevision = z.infer<typeof storefrontSettingsRevisionSchema>
export type StorefrontSettingsWorkflowStatus = z.infer<
  typeof storefrontSettingsWorkflowStatusSchema
>
export type StorefrontSettingsRollbackPayload = z.infer<
  typeof storefrontSettingsRollbackPayloadSchema
>
export type StorefrontSettingsVersionHistoryEntry = z.infer<
  typeof storefrontSettingsVersionHistoryEntrySchema
>
export type StorefrontSettingsVersionHistoryResponse = z.infer<
  typeof storefrontSettingsVersionHistoryResponseSchema
>
export type StorefrontLandingResponse = z.infer<typeof storefrontLandingResponseSchema>
export type StorefrontCatalogQuery = z.infer<typeof storefrontCatalogQuerySchema>
export type StorefrontCatalogResponse = z.infer<typeof storefrontCatalogResponseSchema>
export type StorefrontProductDetail = z.infer<typeof storefrontProductDetailSchema>
export type StorefrontProductResponse = z.infer<typeof storefrontProductResponseSchema>
export type StorefrontLegalPageResponse = z.infer<typeof storefrontLegalPageResponseSchema>
export type StorefrontRecommendationReport = z.infer<
  typeof storefrontRecommendationReportSchema
>
export type StorefrontMerchandisingExperimentSurface = z.infer<
  typeof storefrontMerchandisingExperimentSurfaceSchema
>
export type StorefrontMerchandisingAutomationReport = z.infer<
  typeof storefrontMerchandisingAutomationReportSchema
>
