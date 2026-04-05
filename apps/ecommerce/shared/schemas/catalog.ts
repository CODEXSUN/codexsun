import { z } from "zod"

const hexColorSchema = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i)

export const storefrontHighlightSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
})

export const storefrontSearchDepartmentSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
})

export const storefrontSearchSchema = z.object({
  placeholder: z.string().min(1),
  departmentLabel: z.string().min(1),
  departments: z.array(storefrontSearchDepartmentSchema).min(1),
})

export const storefrontHeroSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  primaryCtaLabel: z.string().min(1),
  primaryCtaHref: z.string().min(1),
  secondaryCtaLabel: z.string().min(1),
  secondaryCtaHref: z.string().min(1),
  heroImageUrl: z.string().min(1),
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
  ctaHref: z.string().min(1).nullable(),
})

export const storefrontPromoSectionSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  primaryCtaLabel: z.string().min(1),
  primaryCtaHref: z.string().min(1),
  secondaryCtaLabel: z.string().min(1),
  secondaryCtaHref: z.string().min(1),
})

export const storefrontTrustNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  iconKey: z.enum(["sparkles", "truck", "shield"]),
})

export const storefrontFooterLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
})

export const storefrontFooterGroupSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  links: z.array(storefrontFooterLinkSchema).min(1),
})

export const storefrontFooterSchema = z.object({
  description: z.string().min(1),
  groups: z.array(storefrontFooterGroupSchema).min(1),
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
  availableQuantity: z.number().int().min(0),
  tagNames: z.array(z.string().min(1)),
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
  href: z.string().min(1),
})

export const storefrontSettingsSchema = z.object({
  id: z.string().min(1),
  hero: storefrontHeroSchema,
  homeSlider: storefrontHomeSliderSchema,
  search: storefrontSearchSchema,
  sections: z.object({
    featured: storefrontSectionCopySchema,
    categories: storefrontSectionCopySchema,
    newArrivals: storefrontSectionCopySchema,
    bestSellers: storefrontSectionCopySchema,
    cta: storefrontPromoSectionSchema,
  }),
  trustNotes: z.array(storefrontTrustNoteSchema).min(1),
  footer: storefrontFooterSchema,
  announcement: z.string().min(1),
  supportPhone: z.string().min(1),
  supportEmail: z.email(),
  freeShippingThreshold: z.number().finite().nonnegative(),
  defaultShippingAmount: z.number().finite().nonnegative(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontLandingResponseSchema = z.object({
  settings: storefrontSettingsSchema,
  featured: z.array(storefrontProductCardSchema),
  newArrivals: z.array(storefrontProductCardSchema),
  bestSellers: z.array(storefrontProductCardSchema),
  categories: z.array(storefrontCategorySummarySchema),
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
})

export const storefrontProductResponseSchema = z.object({
  settings: storefrontSettingsSchema,
  item: storefrontProductDetailSchema,
  relatedItems: z.array(storefrontProductCardSchema),
})

export type StorefrontHero = z.infer<typeof storefrontHeroSchema>
export type StorefrontHomeSliderTheme = z.infer<typeof storefrontHomeSliderThemeSchema>
export type StorefrontHomeSliderSlide = z.infer<typeof storefrontHomeSliderSlideSchema>
export type StorefrontHomeSlider = z.infer<typeof storefrontHomeSliderSchema>
export type StorefrontHighlight = z.infer<typeof storefrontHighlightSchema>
export type StorefrontSearch = z.infer<typeof storefrontSearchSchema>
export type StorefrontSearchDepartment = z.infer<typeof storefrontSearchDepartmentSchema>
export type StorefrontSectionCopy = z.infer<typeof storefrontSectionCopySchema>
export type StorefrontPromoSection = z.infer<typeof storefrontPromoSectionSchema>
export type StorefrontTrustNote = z.infer<typeof storefrontTrustNoteSchema>
export type StorefrontFooter = z.infer<typeof storefrontFooterSchema>
export type StorefrontFooterGroup = z.infer<typeof storefrontFooterGroupSchema>
export type StorefrontFooterLink = z.infer<typeof storefrontFooterLinkSchema>
export type StorefrontProductCard = z.infer<typeof storefrontProductCardSchema>
export type StorefrontCategorySummary = z.infer<typeof storefrontCategorySummarySchema>
export type StorefrontSettings = z.infer<typeof storefrontSettingsSchema>
export type StorefrontLandingResponse = z.infer<typeof storefrontLandingResponseSchema>
export type StorefrontCatalogQuery = z.infer<typeof storefrontCatalogQuerySchema>
export type StorefrontCatalogResponse = z.infer<typeof storefrontCatalogResponseSchema>
export type StorefrontProductDetail = z.infer<typeof storefrontProductDetailSchema>
export type StorefrontProductResponse = z.infer<typeof storefrontProductResponseSchema>
