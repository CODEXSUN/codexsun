import { z } from 'zod'

export const storefrontDepartmentSchema = z.enum(['women', 'men', 'kids', 'accessories'])

export const storefrontProductColorSchema = z.object({
  name: z.string().min(1),
  swatch: z.string().nullable(),
})

export const storefrontReviewSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  username: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().nullable(),
  review: z.string().nullable(),
  createdAt: z.string().min(1),
  verifiedPurchase: z.boolean(),
})

export const storefrontBrandSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  image: z.string().nullable(),
  productCount: z.number().int().nonnegative(),
  featuredLabel: z.boolean(),
})

export const storefrontCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  department: storefrontDepartmentSchema,
  description: z.string().nullable(),
  image: z.string().nullable(),
  menuImage: z.string().nullable(),
  positionOrder: z.number().int(),
  showInTopMenu: z.boolean(),
  showInCatalogSection: z.boolean(),
  productCount: z.number().int().nonnegative(),
})

export const storefrontProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  brandSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  categoryName: z.string().min(1),
  department: storefrontDepartmentSchema,
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  rating: z.number(),
  reviewCount: z.number().int().nonnegative(),
  inventory: z.number(),
  homeSlider: z.boolean(),
  homeSliderOrder: z.number().int(),
  promoSlider: z.boolean(),
  promoSliderOrder: z.number().int(),
  featureSection: z.boolean(),
  featureSectionOrder: z.number().int(),
  featured: z.boolean(),
  newArrival: z.boolean(),
  bestseller: z.boolean(),
  featuredLabel: z.boolean(),
  catalogBadge: z.string().nullable(),
  images: z.array(z.string().min(1)),
  colors: z.array(storefrontProductColorSchema),
  sizes: z.array(z.string().min(1)),
  fabric: z.string().nullable(),
  fit: z.string().nullable(),
  sleeve: z.string().nullable(),
  occasion: z.string().nullable(),
  shortDescription: z.string().nullable(),
  description: z.string().nullable(),
  shippingNote: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontDeliveryMethodSchema = z.enum(['standard', 'priority', 'signature'])

export const storefrontPaymentMethodSchema = z.enum(['upi', 'card', 'cod'])

export const storefrontCheckoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  size: z.string().min(1),
  color: z.string().min(1),
})

export const storefrontCheckoutPayloadSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(5),
  addressLine1: z.string().trim().min(1),
  addressLine2: z.string().trim().nullish().transform((value) => value?.trim() || null),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  country: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  note: z.string().trim().nullish().transform((value) => value?.trim() || null),
  deliveryMethod: storefrontDeliveryMethodSchema,
  paymentMethod: storefrontPaymentMethodSchema,
  items: z.array(storefrontCheckoutItemSchema).min(1),
})

export const storefrontPaymentVerificationPayloadSchema = z.object({
  storefrontOrderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

export const storefrontOrderItemSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  productId: z.string().min(1),
  productName: z.string().min(1),
  productSlug: z.string().min(1),
  sku: z.string().min(1),
  size: z.string().min(1),
  color: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontOrderSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  status: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(5),
  addressLine1: z.string().min(1),
  addressLine2: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
  note: z.string().nullable(),
  deliveryMethod: storefrontDeliveryMethodSchema,
  paymentMethod: storefrontPaymentMethodSchema,
  paymentStatus: z.string().min(1),
  paymentGateway: z.string().nullable(),
  paymentGatewayOrderId: z.string().nullable(),
  paymentGatewayPaymentId: z.string().nullable(),
  paymentGatewaySignature: z.string().nullable(),
  paymentCapturedAt: z.string().nullable(),
  subtotal: z.number().nonnegative(),
  shippingAmount: z.number().nonnegative(),
  handlingAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  currency: z.string().min(1),
  items: z.array(storefrontOrderItemSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontRazorpayCheckoutSessionSchema = z.object({
  provider: z.literal('razorpay'),
  keyId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  image: z.string().nullable(),
  prefillName: z.string().nullable(),
  prefillEmail: z.string().nullable(),
  prefillContact: z.string().nullable(),
  themeColor: z.string().nullable(),
})

export const storefrontCatalogResponseSchema = z.object({
  brands: z.array(storefrontBrandSchema),
  categories: z.array(storefrontCategorySchema),
  products: z.array(storefrontProductSchema),
  reviews: z.array(storefrontReviewSchema),
})

export const storefrontCheckoutResponseSchema = z.object({
  order: storefrontOrderSchema,
})

export const storefrontOrderListResponseSchema = z.object({
  items: z.array(storefrontOrderSchema),
})

export const storefrontCheckoutSessionResponseSchema = z.object({
  order: storefrontOrderSchema,
  requiresPayment: z.boolean(),
  paymentSession: storefrontRazorpayCheckoutSessionSchema.nullable(),
})

export type StorefrontDepartment = z.infer<typeof storefrontDepartmentSchema>
export type StorefrontProductColor = z.infer<typeof storefrontProductColorSchema>
export type StorefrontReview = z.infer<typeof storefrontReviewSchema>
export type StorefrontBrand = z.infer<typeof storefrontBrandSchema>
export type StorefrontCategory = z.infer<typeof storefrontCategorySchema>
export type StorefrontProduct = z.infer<typeof storefrontProductSchema>
export type StorefrontCatalogResponse = z.infer<typeof storefrontCatalogResponseSchema>
export type StorefrontDeliveryMethod = z.infer<typeof storefrontDeliveryMethodSchema>
export type StorefrontPaymentMethod = z.infer<typeof storefrontPaymentMethodSchema>
export type StorefrontCheckoutItem = z.infer<typeof storefrontCheckoutItemSchema>
export type StorefrontCheckoutPayload = z.infer<typeof storefrontCheckoutPayloadSchema>
export type StorefrontPaymentVerificationPayload = z.infer<typeof storefrontPaymentVerificationPayloadSchema>
export type StorefrontOrderItem = z.infer<typeof storefrontOrderItemSchema>
export type StorefrontOrder = z.infer<typeof storefrontOrderSchema>
export type StorefrontCheckoutResponse = z.infer<typeof storefrontCheckoutResponseSchema>
export type StorefrontOrderListResponse = z.infer<typeof storefrontOrderListResponseSchema>
export type StorefrontRazorpayCheckoutSession = z.infer<typeof storefrontRazorpayCheckoutSessionSchema>
export type StorefrontCheckoutSessionResponse = z.infer<typeof storefrontCheckoutSessionResponseSchema>
