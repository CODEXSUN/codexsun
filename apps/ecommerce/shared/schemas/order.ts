import { z } from "zod"

export const storefrontAddressSchema = z.object({
  fullName: z.string().min(1),
  email: z.email(),
  phoneNumber: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  pincode: z.string().min(1),
})

export const storefrontFulfillmentMethodSchema = z.enum(["delivery", "store_pickup"])
export const storefrontCheckoutPaymentMethodSchema = z.enum(["online", "pay_at_store"])

export const storefrontPickupLocationSnapshotSchema = z.object({
  storeName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  pincode: z.string().min(1),
  contactPhone: z.string().min(1),
  contactEmail: z.email(),
  pickupNote: z.string().min(1),
})

export const storefrontCartItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
})

export const storefrontOrderItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brandName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  variantLabel: z.string().nullable().default(null),
  attributes: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .default([]),
  quantity: z.number().int().min(1),
  unitPrice: z.number().finite().nonnegative(),
  mrp: z.number().finite().nonnegative(),
  lineTotal: z.number().finite().nonnegative(),
})

export const storefrontOrderTimelineEventSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
  createdAt: z.string().min(1),
})

export const storefrontPaymentSessionSchema = z.object({
  provider: z.enum(["razorpay", "offline"]),
  mode: z.enum(["live", "mock", "offline"]),
  keyId: z.string().nullable(),
  providerOrderId: z.string().nullable(),
  amount: z.number().int().nonnegative(),
  currency: z.string().min(1),
  receipt: z.string().min(1),
  businessName: z.string().min(1),
  checkoutImage: z.string().nullable(),
  themeColor: z.string().nullable(),
})

export const storefrontOrderSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  customerAccountId: z.string().nullable(),
  coreContactId: z.string().min(1),
  status: z.enum([
    "pending_payment",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  paymentProvider: z.enum(["razorpay", "store"]),
  paymentMode: z.enum(["live", "mock", "offline"]),
  fulfillmentMethod: storefrontFulfillmentMethodSchema,
  paymentCollectionMethod: storefrontCheckoutPaymentMethodSchema,
  pickupLocation: storefrontPickupLocationSnapshotSchema.nullable(),
  providerOrderId: z.string().nullable(),
  providerPaymentId: z.string().nullable(),
  shippingAddress: storefrontAddressSchema,
  billingAddress: storefrontAddressSchema,
  items: z.array(storefrontOrderItemSchema).min(1),
  itemCount: z.number().int().min(1),
  subtotalAmount: z.number().finite().nonnegative(),
  discountAmount: z.number().finite().nonnegative(),
  shippingAmount: z.number().finite().nonnegative(),
  handlingAmount: z.number().finite().nonnegative(),
  totalAmount: z.number().finite().nonnegative(),
  currency: z.string().min(1),
  notes: z.string().nullable(),
  timeline: z.array(storefrontOrderTimelineEventSchema).min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontCheckoutPayloadSchema = z.object({
  items: z.array(storefrontCartItemInputSchema).min(1),
  fulfillmentMethod: storefrontFulfillmentMethodSchema.default("delivery"),
  paymentMethod: storefrontCheckoutPaymentMethodSchema.default("online"),
  shippingAddress: storefrontAddressSchema,
  billingAddress: storefrontAddressSchema,
  notes: z.string().trim().nullable().optional().default(null),
})

export const storefrontCheckoutResponseSchema = z.object({
  order: storefrontOrderSchema,
  payment: storefrontPaymentSessionSchema,
})

export const storefrontPaymentVerificationPayloadSchema = z.object({
  orderId: z.string().min(1),
  providerOrderId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  signature: z.string().min(1),
})

export const storefrontOrderListResponseSchema = z.object({
  items: z.array(storefrontOrderSchema),
})

export const storefrontOrderResponseSchema = z.object({
  item: storefrontOrderSchema,
})

export const storefrontOrderTrackingLookupSchema = z.object({
  orderNumber: z.string().trim().min(1),
  email: z.email(),
})

export const storefrontPaymentConfigSchema = z.object({
  provider: z.literal("razorpay"),
  enabled: z.boolean(),
  mode: z.enum(["live", "mock"]),
  keyId: z.string().nullable(),
  businessName: z.string().min(1),
  checkoutImage: z.string().nullable(),
  themeColor: z.string().nullable(),
})

export type StorefrontAddress = z.infer<typeof storefrontAddressSchema>
export type StorefrontFulfillmentMethod = z.infer<typeof storefrontFulfillmentMethodSchema>
export type StorefrontCheckoutPaymentMethod = z.infer<typeof storefrontCheckoutPaymentMethodSchema>
export type StorefrontPickupLocationSnapshot = z.infer<typeof storefrontPickupLocationSnapshotSchema>
export type StorefrontCartItemInput = z.infer<typeof storefrontCartItemInputSchema>
export type StorefrontOrderItem = z.infer<typeof storefrontOrderItemSchema>
export type StorefrontOrderTimelineEvent = z.infer<typeof storefrontOrderTimelineEventSchema>
export type StorefrontPaymentSession = z.infer<typeof storefrontPaymentSessionSchema>
export type StorefrontOrder = z.infer<typeof storefrontOrderSchema>
export type StorefrontCheckoutPayload = z.infer<typeof storefrontCheckoutPayloadSchema>
export type StorefrontCheckoutResponse = z.infer<typeof storefrontCheckoutResponseSchema>
export type StorefrontPaymentVerificationPayload = z.infer<typeof storefrontPaymentVerificationPayloadSchema>
export type StorefrontOrderListResponse = z.infer<typeof storefrontOrderListResponseSchema>
export type StorefrontOrderResponse = z.infer<typeof storefrontOrderResponseSchema>
export type StorefrontOrderTrackingLookup = z.infer<typeof storefrontOrderTrackingLookupSchema>
export type StorefrontPaymentConfig = z.infer<typeof storefrontPaymentConfigSchema>
