import { z } from "zod"

import { storefrontDepartmentSchema } from "./storefront.js"

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

export const productListResponseSchema = z.object({
  items: z.array(productSummarySchema),
})

export const productResponseSchema = z.object({
  item: productSchema,
})

export type ProductImage = z.infer<typeof productImageSchema>
export type ProductVariantImage = z.infer<typeof productVariantImageSchema>
export type ProductVariantAttribute = z.infer<
  typeof productVariantAttributeSchema
>
export type ProductVariant = z.infer<typeof productVariantSchema>
export type ProductPrice = z.infer<typeof productPriceSchema>
export type ProductDiscount = z.infer<typeof productDiscountSchema>
export type ProductOffer = z.infer<typeof productOfferSchema>
export type ProductAttribute = z.infer<typeof productAttributeSchema>
export type ProductAttributeValue = z.infer<
  typeof productAttributeValueSchema
>
export type ProductVariantMap = z.infer<typeof productVariantMapSchema>
export type ProductStockItem = z.infer<typeof productStockItemSchema>
export type ProductStockMovement = z.infer<
  typeof productStockMovementSchema
>
export type ProductSeo = z.infer<typeof productSeoSchema>
export type ProductStorefront = z.infer<typeof productStorefrontSchema>
export type ProductTag = z.infer<typeof productTagSchema>
export type ProductReview = z.infer<typeof productReviewSchema>
export type ProductSummary = z.infer<typeof productSummarySchema>
export type Product = z.infer<typeof productSchema>
export type ProductListResponse = z.infer<typeof productListResponseSchema>
export type ProductResponse = z.infer<typeof productResponseSchema>
