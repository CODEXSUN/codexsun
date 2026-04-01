import { z } from 'zod'
import { storefrontDepartmentSchema } from './storefront'

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

const nullableTrimmedString = z.string().trim().nullish().transform((value) => value || null)
const dashString = z.string().trim().nullish().transform((value) => value?.trim() || '-')
const defaultUnknownId = z.string().trim().nullish().transform((value) => value?.trim() || '1')
const decimalValue = z.number().finite()

export const productImageInputSchema = z.object({
  imageUrl: z.string().trim().min(1),
  isPrimary: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
})

export const productVariantImageInputSchema = z.object({
  imageUrl: z.string().trim().min(1),
  isPrimary: z.boolean().optional().default(false),
})

export const productVariantAttributeInputSchema = z.object({
  attributeName: z.string().trim().min(1),
  attributeValue: z.string().trim().min(1),
})

export const productVariantInputSchema = z.object({
  clientKey: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  variantName: z.string().trim().min(1),
  price: decimalValue.default(0),
  costPrice: decimalValue.default(0),
  stockQuantity: decimalValue.default(0),
  openingStock: decimalValue.default(0),
  weight: z.number().finite().nullable().optional().default(null),
  barcode: nullableTrimmedString,
  isActive: z.boolean().optional().default(true),
  images: z.array(productVariantImageInputSchema).default([]),
  attributes: z.array(productVariantAttributeInputSchema).default([]),
})

export const productPriceInputSchema = z.object({
  variantClientKey: nullableTrimmedString,
  mrp: decimalValue.default(0),
  sellingPrice: decimalValue.default(0),
  costPrice: decimalValue.default(0),
})

export const productDiscountInputSchema = z.object({
  variantClientKey: nullableTrimmedString,
  discountType: z.string().trim().min(1),
  discountValue: decimalValue.default(0),
  startDate: nullableTrimmedString,
  endDate: nullableTrimmedString,
})

export const productOfferInputSchema = z.object({
  title: z.string().trim().min(1),
  description: nullableTrimmedString,
  offerPrice: decimalValue.default(0),
  startDate: nullableTrimmedString,
  endDate: nullableTrimmedString,
})

export const productAttributeInputSchema = z.object({
  clientKey: z.string().trim().min(1),
  name: z.string().trim().min(1),
})

export const productAttributeValueInputSchema = z.object({
  clientKey: z.string().trim().min(1),
  attributeClientKey: z.string().trim().min(1),
  value: z.string().trim().min(1),
})

export const productStockItemInputSchema = z.object({
  variantClientKey: nullableTrimmedString,
  warehouseId: z.string().trim().min(1),
  quantity: decimalValue.default(0),
  reservedQuantity: decimalValue.default(0),
})

export const productStockMovementInputSchema = z.object({
  variantClientKey: nullableTrimmedString,
  warehouseId: nullableTrimmedString,
  movementType: z.string().trim().min(1),
  quantity: decimalValue.default(0),
  referenceType: nullableTrimmedString,
  referenceId: nullableTrimmedString,
  movementAt: nullableTrimmedString,
})

export const productSeoInputSchema = z.object({
  metaTitle: nullableTrimmedString,
  metaDescription: nullableTrimmedString,
  metaKeywords: nullableTrimmedString,
})

export const productStorefrontInputSchema = z.object({
  department: storefrontDepartmentSchema.nullish().transform((value) => value ?? null),
  homeSliderEnabled: z.boolean().optional().default(false),
  homeSliderOrder: z.number().int().optional().default(0),
  promoSliderEnabled: z.boolean().optional().default(false),
  promoSliderOrder: z.number().int().optional().default(0),
  featureSectionEnabled: z.boolean().optional().default(false),
  featureSectionOrder: z.number().int().optional().default(0),
  isNewArrival: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isFeaturedLabel: z.boolean().optional().default(false),
  catalogBadge: nullableTrimmedString,
  fabric: nullableTrimmedString,
  fit: nullableTrimmedString,
  sleeve: nullableTrimmedString,
  occasion: nullableTrimmedString,
  shippingNote: nullableTrimmedString,
})

export const productTagInputSchema = z.object({
  name: z.string().trim().min(1),
})

export const productReviewInputSchema = z.object({
  userId: nullableTrimmedString,
  rating: z.number().int().min(1).max(5),
  review: nullableTrimmedString,
  reviewDate: nullableTrimmedString,
})

export const productUpsertPayloadSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().nullish().transform((value) => value?.trim() || ''),
  description: dashString,
  shortDescription: dashString,
  brandId: defaultUnknownId,
  categoryId: defaultUnknownId,
  productGroupId: defaultUnknownId,
  productTypeId: defaultUnknownId,
  unitId: defaultUnknownId,
  hsnCodeId: defaultUnknownId,
  styleId: defaultUnknownId,
  sku: z.string().trim().nullish().transform((value) => value?.trim() || ''),
  hasVariants: z.boolean().optional().default(false),
  basePrice: decimalValue.default(0),
  costPrice: decimalValue.default(0),
  taxId: defaultUnknownId,
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  images: z.array(productImageInputSchema).default([]),
  variants: z.array(productVariantInputSchema).default([]),
  prices: z.array(productPriceInputSchema).default([]),
  discounts: z.array(productDiscountInputSchema).default([]),
  offers: z.array(productOfferInputSchema).default([]),
  attributes: z.array(productAttributeInputSchema).default([]),
  attributeValues: z.array(productAttributeValueInputSchema).default([]),
  stockItems: z.array(productStockItemInputSchema).default([]),
  stockMovements: z.array(productStockMovementInputSchema).default([]),
  seo: productSeoInputSchema.nullish().transform((value) => value ?? null),
  storefront: productStorefrontInputSchema.nullish().transform((value) => value ?? null),
  tags: z.array(productTagInputSchema).default([]),
  reviews: z.array(productReviewInputSchema).default([]),
})

export const productListResponseSchema = z.object({
  items: z.array(productSummarySchema),
})

export const productResponseSchema = z.object({
  item: productSchema,
})

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
export type ProductStockItemInput = z.infer<typeof productStockItemInputSchema>
export type ProductStockMovementInput = z.infer<typeof productStockMovementInputSchema>
export type ProductSeoInput = z.infer<typeof productSeoInputSchema>
export type ProductStorefrontInput = z.infer<typeof productStorefrontInputSchema>
export type ProductTagInput = z.infer<typeof productTagInputSchema>
export type ProductReviewInput = z.infer<typeof productReviewInputSchema>
export type ProductUpsertPayload = z.infer<typeof productUpsertPayloadSchema>
export type ProductListResponse = z.infer<typeof productListResponseSchema>
export type ProductResponse = z.infer<typeof productResponseSchema>
