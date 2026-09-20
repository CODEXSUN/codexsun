import { z } from "zod";

const code = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .transform((value) => value.toUpperCase());
const currency = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

export const createMenuCategorySchema = z.object({
  businessId: z.string().uuid(),
  code,
  name: z.string().trim().min(2).max(120),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});
export const createMenuItemSchema = z.object({
  businessId: z.string().uuid(),
  categoryId: z.string().uuid(),
  code,
  itemType: z.enum(["food", "beverage", "packaged", "service"]),
  name: z.string().trim().min(2).max(160),
  taxCode: z.string().trim().max(40).optional(),
});
export const createMenuVariantSchema = z.object({
  code,
  itemId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
});
export const createPriceBookSchema = z.object({
  businessId: z.string().uuid(),
  code,
  currency,
  name: z.string().trim().min(2).max(120),
});
export const setMenuPriceSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  itemId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  priceBookId: z.string().uuid(),
  serviceChannelId: z.string().uuid().optional(),
  validFrom: z.string().date(),
  validTo: z.string().date().optional(),
  variantId: z.string().uuid().optional(),
});
export const createSpecialCampaignSchema = z.object({
  businessId: z.string().uuid(),
  endsAt: z.string().datetime({ offset: true }),
  locationId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  priority: z.number().int().min(0).max(10_000).default(0),
  scope: z.enum(["business", "location"]),
  startsAt: z.string().datetime({ offset: true }),
  status: z.enum(["active", "draft", "inactive"]),
});
export const createSpecialPriceSchema = z
  .object({
    amountMinor: z.number().int().nonnegative().optional(),
    businessId: z.string().uuid(),
    campaignId: z.string().uuid(),
    discountBasisPoints: z.number().int().min(1).max(10_000).optional(),
    itemId: z.string().uuid(),
    usageLimit: z.number().int().positive().optional(),
    variantId: z.string().uuid().optional(),
  })
  .refine((input) => Number(input.amountMinor !== undefined) + Number(input.discountBasisPoints !== undefined) === 1, {
    message: "Set either an amount or a discount, but not both.",
  });
export const uploadMenuMediaQuerySchema = z.object({
  businessId: z.string().uuid(),
  height: z.coerce.number().int().positive().max(20_000).optional(),
  itemId: z.string().uuid(),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
  usage: z.enum(["delivery", "menu", "qr"]),
  variantId: z.string().uuid().optional(),
  width: z.coerce.number().int().positive().max(20_000).optional(),
});
export const createItemAvailabilitySchema = z.object({
  businessId: z.string().uuid(),
  endsAt: z.string().datetime({ offset: true }).optional(),
  itemId: z.string().uuid(),
  locationId: z.string().uuid(),
  reason: z.string().trim().max(255).optional(),
  serviceChannelId: z.string().uuid().optional(),
  startsAt: z.string().datetime({ offset: true }),
  status: z.enum(["available", "unavailable"]),
  variantId: z.string().uuid().optional(),
});
export const createModifierGroupSchema = z.object({
  businessId: z.string().uuid(),
  code,
  maxSelections: z.number().int().min(1).max(20),
  minSelections: z.number().int().min(0).max(20),
  name: z.string().trim().min(2).max(120),
});
export const createModifierOptionSchema = z.object({
  businessId: z.string().uuid(),
  code,
  groupId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  priceAdjustmentMinor: z.number().int().min(-10_000_000).max(10_000_000).default(0),
  stockItemRef: z.string().trim().max(120).optional(),
});
export const assignItemModifierGroupSchema = z.object({
  businessId: z.string().uuid(),
  groupId: z.string().uuid(),
  itemId: z.string().uuid(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  variantId: z.string().uuid().optional(),
});
export const createAllergenTagSchema = z.object({
  businessId: z.string().uuid(),
  code,
  name: z.string().trim().min(2).max(120),
  severity: z.enum(["high", "low", "medium"]),
});
export const assignItemAllergenSchema = z.object({
  allergenTagId: z.string().uuid(),
  businessId: z.string().uuid(),
  itemId: z.string().uuid(),
  note: z.string().trim().max(255).optional(),
  variantId: z.string().uuid().optional(),
});
export const menuCatalogQuerySchema = z.object({ businessId: z.string().uuid() });
export const effectivePriceQuerySchema = z.object({
  businessDate: z.string().date(),
  itemId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  priceBookId: z.string().uuid(),
  serviceChannelId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
});
export const effectiveAvailabilityQuerySchema = z.object({
  at: z.string().datetime({ offset: true }),
  itemId: z.string().uuid(),
  locationId: z.string().uuid(),
  serviceChannelId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
});
export const effectiveSaleabilityQuerySchema = z.object({
  at: z.string().datetime({ offset: true }),
  businessId: z.string().uuid(),
  itemId: z.string().uuid(),
  locationId: z.string().uuid(),
  priceBookId: z.string().uuid(),
  serviceChannelId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
});

const categorySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  sortOrder: z.number(),
  active: z.boolean(),
});
const itemSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  categoryId: z.string(),
  code: z.string(),
  name: z.string(),
  itemType: z.enum(["food", "beverage", "packaged", "service"]),
  taxCode: z.string().nullable(),
  active: z.boolean(),
  variants: z.array(z.object({ id: z.string(), code: z.string(), name: z.string(), active: z.boolean() })),
});
const priceBookSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  currency: z.string(),
  active: z.boolean(),
});
const priceSchema = z.object({
  id: z.string(),
  priceBookId: z.string(),
  itemId: z.string(),
  variantId: z.string().nullable(),
  locationId: z.string().nullable(),
  serviceChannelId: z.string().nullable(),
  amountMinor: z.number(),
  validFrom: z.string(),
  validTo: z.string().nullable(),
  active: z.boolean(),
});
const specialCampaignSchema = z.object({
  businessId: z.string(),
  endsAt: z.string(),
  id: z.string(),
  locationId: z.string().nullable(),
  name: z.string(),
  priority: z.number(),
  scope: z.enum(["business", "location"]),
  startsAt: z.string(),
  status: z.enum(["active", "draft", "inactive"]),
});
const specialPriceSchema = z.object({
  amountMinor: z.number().nullable(),
  campaignId: z.string(),
  discountBasisPoints: z.number().nullable(),
  id: z.string(),
  itemId: z.string(),
  usageLimit: z.number().nullable(),
  usedCount: z.number(),
  variantId: z.string().nullable(),
});
const mediaSchema = z.object({
  assetId: z.string(),
  checksum: z.string(),
  height: z.number().nullable(),
  id: z.string(),
  itemId: z.string(),
  mimeType: z.string(),
  sortOrder: z.number(),
  status: z.enum(["active", "processing", "rejected"]),
  usage: z.enum(["delivery", "menu", "qr"]),
  variantId: z.string().nullable(),
  width: z.number().nullable(),
});
const availabilitySchema = z.object({
  endsAt: z.string().nullable(),
  id: z.string(),
  itemId: z.string(),
  locationId: z.string(),
  reason: z.string().nullable(),
  serviceChannelId: z.string().nullable(),
  startsAt: z.string(),
  status: z.enum(["available", "unavailable"]),
  variantId: z.string().nullable(),
});
const modifierOptionSchema = z.object({
  active: z.boolean(),
  code: z.string(),
  groupId: z.string(),
  id: z.string(),
  name: z.string(),
  priceAdjustmentMinor: z.number(),
  stockItemRef: z.string().nullable(),
});
const modifierGroupSchema = z.object({
  active: z.boolean(),
  code: z.string(),
  id: z.string(),
  maxSelections: z.number(),
  minSelections: z.number(),
  name: z.string(),
  options: z.array(modifierOptionSchema),
});
const itemModifierGroupSchema = z.object({
  groupId: z.string(),
  id: z.string(),
  itemId: z.string(),
  sortOrder: z.number(),
  variantId: z.string().nullable(),
});
const allergenTagSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  severity: z.enum(["high", "low", "medium"]),
});
const itemAllergenSchema = z.object({
  allergenTagId: z.string(),
  id: z.string(),
  itemId: z.string(),
  note: z.string().nullable(),
  variantId: z.string().nullable(),
});

export const menuCatalogResponseSchema = z.object({
  allergenTags: z.array(allergenTagSchema),
  availability: z.array(availabilitySchema),
  categories: z.array(categorySchema),
  items: z.array(itemSchema),
  itemAllergens: z.array(itemAllergenSchema),
  itemModifierGroups: z.array(itemModifierGroupSchema),
  media: z.array(mediaSchema),
  modifierGroups: z.array(modifierGroupSchema),
  priceBooks: z.array(priceBookSchema),
  prices: z.array(priceSchema),
  specialCampaigns: z.array(specialCampaignSchema),
  specialPrices: z.array(specialPriceSchema),
});
export const effectivePriceResponseSchema = z.object({ price: priceSchema.nullable() });
export const effectiveAvailabilityResponseSchema = z.object({
  available: z.boolean(),
  rule: availabilitySchema.nullable(),
});
export const effectiveCampaignPriceResponseSchema = z.object({
  amountMinor: z.number().nullable(),
  basePrice: priceSchema.nullable(),
  campaign: specialCampaignSchema.nullable(),
  source: z.enum(["campaign", "normal", "unpriced"]),
  specialPrice: specialPriceSchema.nullable(),
});
export const saleabilityReasonSchema = z.enum([
  "item_not_found",
  "item_inactive",
  "category_inactive",
  "variant_invalid",
  "variant_inactive",
  "location_invalid",
  "channel_invalid",
  "price_book_ineligible",
  "price_missing",
  "item_unavailable",
  "modifier_configuration_invalid",
]);
export const effectiveSaleabilityResponseSchema = z.object({
  availableRule: availabilitySchema.nullable(),
  campaign: specialCampaignSchema.nullable(),
  effectiveAmountMinor: z.number().nullable(),
  invalidModifierGroupIds: z.array(z.string()),
  price: priceSchema.nullable(),
  reasons: z.array(saleabilityReasonSchema),
  saleable: z.boolean(),
  specialPrice: specialPriceSchema.nullable(),
});
export const menuErrorSchema = z.object({ error: z.string() });

export type CreateMenuCategory = z.infer<typeof createMenuCategorySchema>;
export type AssignItemAllergen = z.infer<typeof assignItemAllergenSchema>;
export type AssignItemModifierGroup = z.infer<typeof assignItemModifierGroupSchema>;
export type CreateAllergenTag = z.infer<typeof createAllergenTagSchema>;
export type CreateItemAvailability = z.infer<typeof createItemAvailabilitySchema>;
export type CreateMenuItem = z.infer<typeof createMenuItemSchema>;
export type CreateMenuVariant = z.infer<typeof createMenuVariantSchema>;
export type CreatePriceBook = z.infer<typeof createPriceBookSchema>;
export type CreateSpecialCampaign = z.infer<typeof createSpecialCampaignSchema>;
export type CreateSpecialPrice = z.infer<typeof createSpecialPriceSchema>;
export type CreateModifierGroup = z.infer<typeof createModifierGroupSchema>;
export type CreateModifierOption = z.infer<typeof createModifierOptionSchema>;
export type SetMenuPrice = z.infer<typeof setMenuPriceSchema>;
export type UploadMenuMedia = z.infer<typeof uploadMenuMediaQuerySchema>;
export type MenuCatalog = z.infer<typeof menuCatalogResponseSchema>;
export type MenuPrice = MenuCatalog["prices"][number];
export type MenuAvailability = MenuCatalog["availability"][number];
export type MenuSpecialCampaign = MenuCatalog["specialCampaigns"][number];
export type MenuSpecialPrice = MenuCatalog["specialPrices"][number];
export type EffectiveCampaignPrice = z.infer<typeof effectiveCampaignPriceResponseSchema>;
export type EffectiveSaleabilityInput = z.infer<typeof effectiveSaleabilityQuerySchema>;
export type EffectiveSaleability = z.infer<typeof effectiveSaleabilityResponseSchema>;
export type SaleabilityReason = z.infer<typeof saleabilityReasonSchema>;
