import { z } from "zod"

import { dashStringField } from "./address-book.js"

export const storefrontDepartmentSchema = z.enum([
  "women",
  "men",
  "kids",
  "accessories",
])

export const productImageSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  imageUrl: z.string().min(1),
  isPrimary: z.boolean(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productVariantImageSchema = z.object({
  id: z.string().min(1),
  variantId: z.string().min(1),
  imageUrl: z.string().min(1),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productVariantAttributeSchema = z.object({
  id: z.string().min(1),
  variantId: z.string().min(1),
  attributeName: z.string().min(1),
  attributeValue: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productVariantSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  sku: z.string().min(1),
  variantName: z.string().min(1),
  price: z.number(),
  costPrice: z.number(),
  stockQuantity: z.number(),
  openingStock: z.number(),
  weight: z.number().nullable(),
  barcode: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  images: z.array(productVariantImageSchema),
  attributes: z.array(productVariantAttributeSchema),
})

export const productPriceSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().nullable(),
  mrp: z.number(),
  sellingPrice: z.number(),
  costPrice: z.number(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productDiscountSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().nullable(),
  discountType: z.string().min(1),
  discountValue: z.number(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productOfferSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  offerPrice: z.number(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productAttributeSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productAttributeValueSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  attributeId: z.string().min(1),
  value: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productVariantMapSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  attributeId: z.string().min(1),
  valueId: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productStockItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().nullable(),
  warehouseId: z.string().min(1),
  quantity: z.number(),
  reservedQuantity: z.number(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productStockMovementSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().nullable(),
  warehouseId: z.string().nullable(),
  movementType: z.string().min(1),
  quantity: z.number(),
  referenceType: z.string().nullable(),
  referenceId: z.string().nullable(),
  movementAt: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productSeoSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  metaKeywords: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productStorefrontSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  department: storefrontDepartmentSchema.nullable(),
  homeSliderEnabled: z.boolean(),
  homeSliderOrder: z.number().int(),
  promoSliderEnabled: z.boolean(),
  promoSliderOrder: z.number().int(),
  featureSectionEnabled: z.boolean(),
  featureSectionOrder: z.number().int(),
  isNewArrival: z.boolean(),
  isBestSeller: z.boolean(),
  isFeaturedLabel: z.boolean(),
  catalogBadge: z.string().nullable(),
  promoBadge: z.string().nullable().default(null),
  promoTitle: z.string().nullable().default(null),
  promoSubtitle: z.string().nullable().default(null),
  promoCtaLabel: z.string().nullable().default(null),
  fabric: z.string().nullable(),
  fit: z.string().nullable(),
  sleeve: z.string().nullable(),
  occasion: z.string().nullable(),
  shippingNote: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productTagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productReviewSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  userId: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  review: z.string().nullable(),
  reviewDate: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productSummarySchema = z.object({
  id: z.string().min(1),
  uuid: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),
  brandId: z.string().nullable(),
  brandName: z.string().nullish().transform((value) => value ?? null),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullish().transform((value) => value ?? null),
  productGroupId: z.string().nullable(),
  productGroupName: z.string().nullish().transform((value) => value ?? null),
  productTypeId: z.string().nullable(),
  productTypeName: z.string().nullish().transform((value) => value ?? null),
  unitId: z.string().nullable(),
  hsnCodeId: z.string().nullable(),
  styleId: z.string().nullable(),
  sku: z.string().min(1),
  hasVariants: z.boolean(),
  basePrice: z.number(),
  costPrice: z.number(),
  taxId: z.string().nullable(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  storefrontDepartment: storefrontDepartmentSchema.nullable(),
  homeSliderEnabled: z.boolean(),
  promoSliderEnabled: z.boolean(),
  featureSectionEnabled: z.boolean(),
  isNewArrival: z.boolean(),
  isBestSeller: z.boolean(),
  isFeaturedLabel: z.boolean(),
  primaryImageUrl: z.string().nullable(),
  variantCount: z.number().int(),
  attributeCount: z.number().int(),
  totalStockQuantity: z.number(),
  tagCount: z.number().int(),
  tagNames: z.array(z.string().min(1)).default([]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const productSchema = productSummarySchema.extend({
  images: z.array(productImageSchema),
  variants: z.array(productVariantSchema),
  prices: z.array(productPriceSchema),
  discounts: z.array(productDiscountSchema),
  offers: z.array(productOfferSchema),
  attributes: z.array(productAttributeSchema),
  attributeValues: z.array(productAttributeValueSchema),
  variantMap: z.array(productVariantMapSchema),
  stockItems: z.array(productStockItemSchema),
  stockMovements: z.array(productStockMovementSchema),
  seo: productSeoSchema.nullable(),
  storefront: productStorefrontSchema.nullable(),
  tags: z.array(productTagSchema),
  reviews: z.array(productReviewSchema),
})

export const productImageInputSchema = z.object({
  imageUrl: z.string().trim().min(1),
  isPrimary: z.boolean().optional().default(false),
  sortOrder: z.number().finite().default(0),
  isActive: z.boolean().optional().default(true),
})

export const productVariantImageInputSchema = z.object({
  imageUrl: z.string().trim().min(1),
  isPrimary: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
})

export const productVariantAttributeInputSchema = z.object({
  attributeName: z.string().trim().min(1),
  attributeValue: z.string().trim().min(1),
  isActive: z.boolean().optional().default(true),
})

export const productVariantInputSchema = z.object({
  clientKey: dashStringField,
  sku: z.string().trim().min(1),
  variantName: z.string().trim().min(1),
  price: z.number().finite().default(0),
  costPrice: z.number().finite().default(0),
  stockQuantity: z.number().finite().default(0),
  openingStock: z.number().finite().default(0),
  weight: z.number().finite().nullable().optional().default(null),
  barcode: dashStringField,
  isActive: z.boolean().optional().default(true),
  images: z.array(productVariantImageInputSchema).default([]),
  attributes: z.array(productVariantAttributeInputSchema).default([]),
})

export const productPriceInputSchema = z.object({
  variantId: z.string().trim().min(1).nullable().default(null),
  variantClientKey: dashStringField,
  mrp: z.number().finite().default(0),
  sellingPrice: z.number().finite().default(0),
  costPrice: z.number().finite().default(0),
  isActive: z.boolean().optional().default(true),
})

export const productDiscountInputSchema = z.object({
  variantId: z.string().trim().min(1).nullable().default(null),
  variantClientKey: dashStringField,
  discountType: z.string().trim().min(1),
  discountValue: z.number().finite().default(0),
  startDate: dashStringField,
  endDate: dashStringField,
  isActive: z.boolean().optional().default(true),
})

export const productOfferInputSchema = z.object({
  title: z.string().trim().min(1),
  description: dashStringField,
  offerPrice: z.number().finite().default(0),
  startDate: dashStringField,
  endDate: dashStringField,
  isActive: z.boolean().optional().default(true),
})

export const productAttributeInputSchema = z.object({
  clientKey: dashStringField,
  name: z.string().trim().min(1),
  isActive: z.boolean().optional().default(true),
})

export const productAttributeValueInputSchema = z.object({
  clientKey: dashStringField,
  attributeId: dashStringField,
  attributeClientKey: dashStringField,
  value: z.string().trim().min(1),
  isActive: z.boolean().optional().default(true),
})

export const productVariantMapInputSchema = z.object({
  attributeId: dashStringField,
  attributeClientKey: dashStringField,
  valueId: dashStringField,
  valueClientKey: dashStringField,
  isActive: z.boolean().optional().default(true),
})

export const productStockItemInputSchema = z.object({
  variantId: z.string().trim().min(1).nullable().default(null),
  variantClientKey: dashStringField,
  warehouseId: z.string().trim().min(1),
  quantity: z.number().finite().default(0),
  reservedQuantity: z.number().finite().default(0),
  isActive: z.boolean().optional().default(true),
})

export const productStockMovementInputSchema = z.object({
  variantId: z.string().trim().min(1).nullable().default(null),
  variantClientKey: dashStringField,
  warehouseId: z.string().trim().min(1).nullable().default(null),
  movementType: z.string().trim().min(1),
  quantity: z.number().finite().default(0),
  referenceType: dashStringField,
  referenceId: dashStringField,
  movementAt: z.string().trim().min(1),
  isActive: z.boolean().optional().default(true),
})

export const productSeoInputSchema = z.object({
  metaTitle: dashStringField,
  metaDescription: dashStringField,
  metaKeywords: dashStringField,
  isActive: z.boolean().optional().default(true),
})

export const productStorefrontInputSchema = z.object({
  department: storefrontDepartmentSchema.nullable().default(null),
  homeSliderEnabled: z.boolean().optional().default(false),
  homeSliderOrder: z.number().int().default(0),
  promoSliderEnabled: z.boolean().optional().default(false),
  promoSliderOrder: z.number().int().default(0),
  featureSectionEnabled: z.boolean().optional().default(false),
  featureSectionOrder: z.number().int().default(0),
  isNewArrival: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isFeaturedLabel: z.boolean().optional().default(false),
  catalogBadge: dashStringField,
  promoBadge: dashStringField,
  promoTitle: dashStringField,
  promoSubtitle: dashStringField,
  promoCtaLabel: dashStringField,
  fabric: dashStringField,
  fit: dashStringField,
  sleeve: dashStringField,
  occasion: dashStringField,
  shippingNote: dashStringField,
  isActive: z.boolean().optional().default(true),
})

export const productTagInputSchema = z.object({
  name: z.string().trim().min(1),
  isActive: z.boolean().optional().default(true),
})

export const productReviewInputSchema = z.object({
  userId: z.string().trim().min(1).nullable().default(null),
  rating: z.number().int().min(1).max(5),
  review: dashStringField,
  reviewDate: z.string().trim().min(1),
  isActive: z.boolean().optional().default(true),
})

export const productUpsertPayloadSchema = z.object({
  code: dashStringField,
  name: z.string().trim().min(1),
  slug: dashStringField,
  description: dashStringField,
  shortDescription: dashStringField,
  brandId: z.string().trim().min(1).nullable().default(null),
  brandName: dashStringField,
  categoryId: z.string().trim().min(1).nullable().default(null),
  categoryName: dashStringField,
  productGroupId: z.string().trim().min(1).nullable().default(null),
  productGroupName: dashStringField,
  productTypeId: z.string().trim().min(1).nullable().default(null),
  productTypeName: dashStringField,
  unitId: z.string().trim().min(1).nullable().default(null),
  hsnCodeId: z.string().trim().min(1).nullable().default(null),
  styleId: z.string().trim().min(1).nullable().default(null),
  sku: z.string().trim().min(1),
  hasVariants: z.boolean().optional().default(false),
  basePrice: z.number().finite().default(0),
  costPrice: z.number().finite().default(0),
  taxId: z.string().trim().min(1).nullable().default(null),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  storefrontDepartment: storefrontDepartmentSchema.nullable().default(null),
  homeSliderEnabled: z.boolean().optional().default(false),
  promoSliderEnabled: z.boolean().optional().default(false),
  featureSectionEnabled: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isFeaturedLabel: z.boolean().optional().default(false),
  images: z.array(productImageInputSchema).default([]),
  variants: z.array(productVariantInputSchema).default([]),
  prices: z.array(productPriceInputSchema).default([]),
  discounts: z.array(productDiscountInputSchema).default([]),
  offers: z.array(productOfferInputSchema).default([]),
  attributes: z.array(productAttributeInputSchema).default([]),
  attributeValues: z.array(productAttributeValueInputSchema).default([]),
  variantMap: z.array(productVariantMapInputSchema).default([]),
  stockItems: z.array(productStockItemInputSchema).default([]),
  stockMovements: z.array(productStockMovementInputSchema).default([]),
  seo: productSeoInputSchema.nullable().default(null),
  storefront: productStorefrontInputSchema.nullable().default(null),
  tags: z.array(productTagInputSchema).default([]),
  reviews: z.array(productReviewInputSchema).default([]),
})

export const productBulkEditPayloadSchema = z.object({
  productIds: z.array(z.string().trim().min(1)).min(1),
  categoryId: z.string().trim().min(1).nullable().optional(),
  categoryName: z.string().trim().nullable().optional(),
  storefrontDepartment: storefrontDepartmentSchema.nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  homeSliderEnabled: z.boolean().optional(),
  homeSliderOrder: z.number().int().optional(),
  promoSliderEnabled: z.boolean().optional(),
  promoSliderOrder: z.number().int().optional(),
  featureSectionEnabled: z.boolean().optional(),
  featureSectionOrder: z.number().int().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isFeaturedLabel: z.boolean().optional(),
})

export const productListResponseSchema = z.object({
  items: z.array(productSummarySchema),
})

export const productResponseSchema = z.object({
  item: productSchema,
})

export const productBulkEditResponseSchema = z.object({
  count: z.number().int(),
  updatedIds: z.array(z.string().min(1)),
})

export type StorefrontDepartment = z.infer<typeof storefrontDepartmentSchema>
export type ProductImage = z.infer<typeof productImageSchema>
export type ProductVariantImage = z.infer<typeof productVariantImageSchema>
export type ProductVariantAttribute = z.infer<typeof productVariantAttributeSchema>
export type ProductVariant = z.infer<typeof productVariantSchema>
export type ProductPrice = z.infer<typeof productPriceSchema>
export type ProductDiscount = z.infer<typeof productDiscountSchema>
export type ProductOffer = z.infer<typeof productOfferSchema>
export type ProductAttribute = z.infer<typeof productAttributeSchema>
export type ProductAttributeValue = z.infer<typeof productAttributeValueSchema>
export type ProductVariantMap = z.infer<typeof productVariantMapSchema>
export type ProductStockItem = z.infer<typeof productStockItemSchema>
export type ProductStockMovement = z.infer<typeof productStockMovementSchema>
export type ProductSeo = z.infer<typeof productSeoSchema>
export type ProductStorefront = z.infer<typeof productStorefrontSchema>
export type ProductTag = z.infer<typeof productTagSchema>
export type ProductReview = z.infer<typeof productReviewSchema>
export type ProductSummary = z.infer<typeof productSummarySchema>
export type Product = z.infer<typeof productSchema>
export type ProductImageInput = z.infer<typeof productImageInputSchema>
export type ProductVariantImageInput = z.infer<typeof productVariantImageInputSchema>
export type ProductVariantAttributeInput = z.infer<typeof productVariantAttributeInputSchema>
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>
export type ProductPriceInput = z.infer<typeof productPriceInputSchema>
export type ProductDiscountInput = z.infer<typeof productDiscountInputSchema>
export type ProductOfferInput = z.infer<typeof productOfferInputSchema>
export type ProductAttributeInput = z.infer<typeof productAttributeInputSchema>
export type ProductAttributeValueInput = z.infer<typeof productAttributeValueInputSchema>
export type ProductVariantMapInput = z.infer<typeof productVariantMapInputSchema>
export type ProductStockItemInput = z.infer<typeof productStockItemInputSchema>
export type ProductStockMovementInput = z.infer<typeof productStockMovementInputSchema>
export type ProductSeoInput = z.infer<typeof productSeoInputSchema>
export type ProductStorefrontInput = z.infer<typeof productStorefrontInputSchema>
export type ProductTagInput = z.infer<typeof productTagInputSchema>
export type ProductReviewInput = z.infer<typeof productReviewInputSchema>
export type ProductUpsertPayload = z.infer<typeof productUpsertPayloadSchema>
export type ProductBulkEditPayload = z.infer<typeof productBulkEditPayloadSchema>
export type ProductListResponse = z.infer<typeof productListResponseSchema>
export type ProductResponse = z.infer<typeof productResponseSchema>
export type ProductBulkEditResponse = z.infer<typeof productBulkEditResponseSchema>
