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

export const storefrontShipmentDetailsSchema = z.object({
  carrierName: z.string().trim().min(1).nullable(),
  trackingId: z.string().trim().min(1).nullable(),
  trackingUrl: z.string().trim().min(1).nullable(),
  note: z.string().trim().min(1).nullable(),
  markedFulfilmentAt: z.string().nullable(),
  shippedAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  updatedAt: z.string().min(1),
})

export const storefrontPaymentWebhookEventSchema = z.object({
  id: z.string().min(1),
  provider: z.enum(["razorpay"]),
  providerEventId: z.string().min(1),
  eventType: z.string().min(1),
  signature: z.string().min(1),
  orderId: z.string().nullable(),
  providerOrderId: z.string().nullable(),
  providerPaymentId: z.string().nullable(),
  processingStatus: z.enum(["received", "processed", "ignored", "failed"]),
  processingSummary: z.string().nullable(),
  payloadBody: z.string().min(1),
  receivedAt: z.string().min(1),
  processedAt: z.string().nullable(),
  updatedAt: z.string().min(1),
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

export const storefrontRefundActorSchema = z.enum(["admin", "system", "customer"])
export const storefrontRefundTypeSchema = z.enum(["full", "partial"])
export const storefrontRefundStatusSchema = z.enum([
  "none",
  "requested",
  "queued",
  "processing",
  "refunded",
  "failed",
  "rejected",
])

export const storefrontRefundRecordSchema = z.object({
  type: storefrontRefundTypeSchema,
  status: storefrontRefundStatusSchema,
  requestedAmount: z.number().finite().nonnegative(),
  currency: z.string().min(1),
  reason: z.string().nullable(),
  requestedBy: storefrontRefundActorSchema,
  requestedAt: z.string().nullable(),
  initiatedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  providerRefundId: z.string().nullable(),
  statusSummary: z.string().nullable(),
  updatedAt: z.string().min(1),
})

export const storefrontOrderStatusSchema = z.enum([
  "created",
  "payment_pending",
  "paid",
  "fulfilment_pending",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
])

export const storefrontOrderSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  customerAccountId: z.string().nullable(),
  coreContactId: z.string().min(1),
  status: storefrontOrderStatusSchema,
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  paymentProvider: z.enum(["razorpay", "store"]),
  paymentMode: z.enum(["live", "mock", "offline"]),
  fulfillmentMethod: storefrontFulfillmentMethodSchema,
  paymentCollectionMethod: storefrontCheckoutPaymentMethodSchema,
  pickupLocation: storefrontPickupLocationSnapshotSchema.nullable(),
  shipmentDetails: storefrontShipmentDetailsSchema.nullable(),
  refund: storefrontRefundRecordSchema.nullable(),
  providerOrderId: z.string().nullable(),
  providerPaymentId: z.string().nullable(),
  checkoutFingerprint: z.string().nullable(),
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

export const storefrontRefundRequestPayloadSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().finite().positive().optional(),
  reason: z.string().trim().nullable().optional().default(null),
  requestedBy: storefrontRefundActorSchema.optional().default("admin"),
})

export const storefrontAdminOrderActionSchema = z.enum([
  "cancel",
  "mark_fulfilment_pending",
  "mark_shipped",
  "mark_delivered",
  "resend_confirmation",
])

export const storefrontAdminOrderActionPayloadSchema = z.object({
  orderId: z.string().min(1),
  action: storefrontAdminOrderActionSchema,
  trackingId: z.string().trim().nullable().optional().default(null),
  carrierName: z.string().trim().nullable().optional().default(null),
  trackingUrl: z.string().trim().nullable().optional().default(null),
  note: z.string().trim().nullable().optional().default(null),
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

export const storefrontPaymentReconciliationPayloadSchema = z.object({
  orderIds: z.array(z.string().min(1)).optional().default([]),
  maxOrders: z.number().int().min(1).max(200).optional().default(50),
})

export const storefrontPaymentReconciliationItemSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  providerOrderId: z.string().nullable(),
  action: z.enum(["paid", "failed", "refunded", "noop", "skipped"]),
  paymentStatusBefore: z.enum(["pending", "paid", "failed", "refunded"]),
  paymentStatusAfter: z.enum(["pending", "paid", "failed", "refunded"]),
  orderStatusBefore: storefrontOrderStatusSchema,
  orderStatusAfter: storefrontOrderStatusSchema,
  summary: z.string().min(1),
})

export const storefrontPaymentReconciliationResponseSchema = z.object({
  processedCount: z.number().int().min(0),
  matchedCount: z.number().int().min(0),
  updatedCount: z.number().int().min(0),
  items: z.array(storefrontPaymentReconciliationItemSchema),
})

export const storefrontPaymentSettlementItemSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  orderStatus: storefrontOrderStatusSchema,
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  totalAmount: z.number().finite().nonnegative(),
  currency: z.string().min(1),
  providerOrderId: z.string().nullable(),
  providerPaymentId: z.string().nullable(),
  paidAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  ageHours: z.number().finite().nonnegative(),
})

export const storefrontPaymentExceptionItemSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  orderStatus: storefrontOrderStatusSchema,
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  totalAmount: z.number().finite().nonnegative(),
  currency: z.string().min(1),
  providerOrderId: z.string().nullable(),
  providerPaymentId: z.string().nullable(),
  summary: z.string().min(1),
  lastAttemptAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontPaymentWebhookExceptionItemSchema = z.object({
  id: z.string().min(1),
  providerEventId: z.string().min(1),
  eventType: z.string().min(1),
  processingStatus: z.enum(["received", "processed", "ignored", "failed"]),
  processingSummary: z.string().nullable(),
  orderId: z.string().nullable(),
  providerOrderId: z.string().nullable(),
  providerPaymentId: z.string().nullable(),
  receivedAt: z.string().min(1),
  processedAt: z.string().nullable(),
})

export const storefrontRefundQueueItemSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  orderStatus: storefrontOrderStatusSchema,
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  refundStatus: storefrontRefundStatusSchema,
  refundType: storefrontRefundTypeSchema,
  requestedAmount: z.number().finite().nonnegative(),
  currency: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  providerPaymentId: z.string().nullable(),
  providerRefundId: z.string().nullable(),
  summary: z.string().min(1),
  requestedAt: z.string().nullable(),
  updatedAt: z.string().min(1),
})

export const storefrontRefundStatusUpdatePayloadSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["queued", "processing", "rejected"]),
  reason: z.string().trim().nullable().optional().default(null),
})

export const storefrontPaymentOperationsReportSchema = z.object({
  generatedAt: z.string().min(1),
  summary: z.object({
    livePaymentOrderCount: z.number().int().min(0),
    settlementPendingCount: z.number().int().min(0),
    settlementPendingAmount: z.number().finite().nonnegative(),
    failedPaymentCount: z.number().int().min(0),
    paymentPendingCount: z.number().int().min(0),
    webhookExceptionCount: z.number().int().min(0),
    refundQueueCount: z.number().int().min(0),
    refundInFlightCount: z.number().int().min(0),
    refundedCount: z.number().int().min(0),
  }),
  settlementQueue: z.array(storefrontPaymentSettlementItemSchema),
  failedPayments: z.array(storefrontPaymentExceptionItemSchema),
  webhookExceptions: z.array(storefrontPaymentWebhookExceptionItemSchema),
  refundQueue: z.array(storefrontRefundQueueItemSchema),
})

export const storefrontAdminOrderQueueBucketSchema = z.enum([
  "payment_attention",
  "fulfilment",
  "shipment",
  "pickup",
  "completed",
  "closed",
])

export const storefrontAdminOrderQueueItemSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  orderStatus: storefrontOrderStatusSchema,
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  paymentProvider: z.enum(["razorpay", "store"]),
  paymentMode: z.enum(["live", "mock", "offline"]),
  fulfillmentMethod: storefrontFulfillmentMethodSchema,
  paymentCollectionMethod: storefrontCheckoutPaymentMethodSchema,
  refundStatus: storefrontRefundStatusSchema.nullable(),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  customerPhone: z.string().min(1),
  itemCount: z.number().int().min(1),
  totalAmount: z.number().finite().nonnegative(),
  currency: z.string().min(1),
  itemSummary: z.string().min(1),
  latestTimelineLabel: z.string().min(1),
  latestTimelineSummary: z.string().min(1),
  latestTimelineAt: z.string().min(1),
  queueBucket: storefrontAdminOrderQueueBucketSchema,
  needsAttention: z.boolean(),
  ageHours: z.number().finite().nonnegative(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontAdminOrderOperationsReportSchema = z.object({
  generatedAt: z.string().min(1),
  summary: z.object({
    totalOrders: z.number().int().min(0),
    actionRequiredCount: z.number().int().min(0),
    fulfilmentQueueCount: z.number().int().min(0),
    shipmentQueueCount: z.number().int().min(0),
    pickupQueueCount: z.number().int().min(0),
    completedCount: z.number().int().min(0),
    closedCount: z.number().int().min(0),
  }),
  items: z.array(storefrontAdminOrderQueueItemSchema),
})

export const storefrontCommunicationTemplateCodeSchema = z.enum([
  "storefront_customer_welcome",
  "storefront_campaign_subscription",
  "storefront_order_confirmed",
  "storefront_payment_failed",
  "storefront_order_review_request",
  "storefront_order_shipped",
  "storefront_order_delivered",
])

export const storefrontCommunicationLogItemSchema = z.object({
  id: z.string().min(1),
  templateCode: storefrontCommunicationTemplateCodeSchema,
  templateName: z.string().min(1).nullable(),
  subject: z.string().min(1),
  status: z.enum(["queued", "sent", "failed"]),
  recipientSummary: z.string().min(1),
  referenceType: z.string().nullable(),
  referenceId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  sentAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontCommunicationLogResponseSchema = z.object({
  items: z.array(storefrontCommunicationLogItemSchema),
})

export const storefrontCommunicationResendPayloadSchema = z.object({
  templateCode: storefrontCommunicationTemplateCodeSchema,
  orderId: z.string().trim().min(1).nullable().optional().default(null),
  customerAccountId: z.string().trim().min(1).nullable().optional().default(null),
})

export const storefrontCommunicationResendResponseSchema = z.object({
  resent: z.boolean(),
  templateCode: storefrontCommunicationTemplateCodeSchema,
  referenceId: z.string().min(1),
  deliveryStatus: z.enum(["sent", "failed"]),
  message: z.string().min(1),
})

export const storefrontCommunicationHealthResponseSchema = z.object({
  ready: z.literal(true),
  checkedTemplateCodes: z.array(storefrontCommunicationTemplateCodeSchema),
})

export const storefrontSupportCaseStatusSchema = z.enum([
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
])

export const storefrontSupportCasePrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
])

export const storefrontSupportCaseCategorySchema = z.enum([
  "order",
  "payment",
  "shipment",
  "refund",
  "account",
  "other",
])

export const storefrontSupportCaseSchema = z.object({
  id: z.string().min(1),
  caseNumber: z.string().min(1),
  customerAccountId: z.string().min(1),
  coreContactId: z.string().min(1),
  orderId: z.string().nullable(),
  orderNumber: z.string().nullable(),
  status: storefrontSupportCaseStatusSchema,
  priority: storefrontSupportCasePrioritySchema,
  category: storefrontSupportCaseCategorySchema,
  subject: z.string().min(1),
  message: z.string().min(1),
  adminNote: z.string().nullable(),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  customerPhone: z.string().min(1),
  resolvedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontSupportCaseViewSchema = storefrontSupportCaseSchema.extend({
  orderStatus: storefrontOrderStatusSchema.nullable(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).nullable(),
  orderTotalAmount: z.number().finite().nonnegative().nullable(),
  currency: z.string().nullable(),
})

export const storefrontSupportCaseListResponseSchema = z.object({
  items: z.array(storefrontSupportCaseViewSchema),
})

export const storefrontSupportCaseResponseSchema = z.object({
  item: storefrontSupportCaseViewSchema,
})

export const storefrontSupportCaseCreatePayloadSchema = z.object({
  orderId: z.string().trim().min(1).nullable().optional().default(null),
  category: storefrontSupportCaseCategorySchema,
  priority: storefrontSupportCasePrioritySchema.default("normal"),
  subject: z.string().trim().min(3),
  message: z.string().trim().min(10),
})

export const storefrontSupportCaseAdminUpdatePayloadSchema = z.object({
  caseId: z.string().min(1),
  status: storefrontSupportCaseStatusSchema,
  priority: storefrontSupportCasePrioritySchema.optional(),
  adminNote: z.string().trim().nullable().optional().default(null),
})

export const storefrontSupportQueueReportSchema = z.object({
  generatedAt: z.string().min(1),
  summary: z.object({
    totalCases: z.number().int().min(0),
    openCount: z.number().int().min(0),
    inProgressCount: z.number().int().min(0),
    waitingCustomerCount: z.number().int().min(0),
    resolvedCount: z.number().int().min(0),
    urgentCount: z.number().int().min(0),
  }),
  items: z.array(storefrontSupportCaseViewSchema),
})

export const storefrontReceiptDocumentSchema = z.object({
  fileName: z.string().min(1),
  html: z.string().min(1),
})

export const storefrontOrderRequestTypeSchema = z.enum(["cancellation", "return"])
export const storefrontOrderRequestStatusSchema = z.enum([
  "requested",
  "in_review",
  "approved",
  "rejected",
])

export const storefrontOrderRequestSchema = z.object({
  id: z.string().min(1),
  requestNumber: z.string().min(1),
  type: storefrontOrderRequestTypeSchema,
  status: storefrontOrderRequestStatusSchema,
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  orderItemId: z.string().nullable(),
  customerAccountId: z.string().min(1),
  coreContactId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  customerPhone: z.string().min(1),
  reason: z.string().min(1),
  adminNote: z.string().nullable(),
  requestedAt: z.string().min(1),
  reviewedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontOrderRequestViewSchema = storefrontOrderRequestSchema.extend({
  orderStatus: storefrontOrderStatusSchema,
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  totalAmount: z.number().finite().nonnegative(),
  currency: z.string().min(1),
  itemName: z.string().nullable(),
})

export const storefrontOrderRequestListResponseSchema = z.object({
  items: z.array(storefrontOrderRequestViewSchema),
})

export const storefrontOrderRequestResponseSchema = z.object({
  item: storefrontOrderRequestViewSchema,
})

export const storefrontOrderRequestCreatePayloadSchema = z.object({
  orderId: z.string().min(1),
  type: storefrontOrderRequestTypeSchema,
  orderItemId: z.string().trim().min(1).nullable().optional().default(null),
  reason: z.string().trim().min(10),
})

export const storefrontOrderRequestReviewPayloadSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["in_review", "approved", "rejected"]),
  adminNote: z.string().trim().nullable().optional().default(null),
})

export const storefrontOrderRequestQueueReportSchema = z.object({
  generatedAt: z.string().min(1),
  summary: z.object({
    totalRequests: z.number().int().min(0),
    cancellationCount: z.number().int().min(0),
    returnCount: z.number().int().min(0),
    requestedCount: z.number().int().min(0),
    inReviewCount: z.number().int().min(0),
  }),
  items: z.array(storefrontOrderRequestViewSchema),
})

export type StorefrontAddress = z.infer<typeof storefrontAddressSchema>
export type StorefrontFulfillmentMethod = z.infer<typeof storefrontFulfillmentMethodSchema>
export type StorefrontCheckoutPaymentMethod = z.infer<typeof storefrontCheckoutPaymentMethodSchema>
export type StorefrontPickupLocationSnapshot = z.infer<typeof storefrontPickupLocationSnapshotSchema>
export type StorefrontCartItemInput = z.infer<typeof storefrontCartItemInputSchema>
export type StorefrontOrderItem = z.infer<typeof storefrontOrderItemSchema>
export type StorefrontOrderTimelineEvent = z.infer<typeof storefrontOrderTimelineEventSchema>
export type StorefrontShipmentDetails = z.infer<typeof storefrontShipmentDetailsSchema>
export type StorefrontPaymentWebhookEvent = z.infer<typeof storefrontPaymentWebhookEventSchema>
export type StorefrontPaymentSession = z.infer<typeof storefrontPaymentSessionSchema>
export type StorefrontRefundActor = z.infer<typeof storefrontRefundActorSchema>
export type StorefrontRefundType = z.infer<typeof storefrontRefundTypeSchema>
export type StorefrontRefundStatus = z.infer<typeof storefrontRefundStatusSchema>
export type StorefrontRefundRecord = z.infer<typeof storefrontRefundRecordSchema>
export type StorefrontOrderStatus = z.infer<typeof storefrontOrderStatusSchema>
export type StorefrontOrder = z.infer<typeof storefrontOrderSchema>
export type StorefrontCheckoutPayload = z.infer<typeof storefrontCheckoutPayloadSchema>
export type StorefrontCheckoutResponse = z.infer<typeof storefrontCheckoutResponseSchema>
export type StorefrontPaymentVerificationPayload = z.infer<typeof storefrontPaymentVerificationPayloadSchema>
export type StorefrontRefundRequestPayload = z.infer<typeof storefrontRefundRequestPayloadSchema>
export type StorefrontAdminOrderAction = z.infer<typeof storefrontAdminOrderActionSchema>
export type StorefrontAdminOrderActionPayload = z.infer<
  typeof storefrontAdminOrderActionPayloadSchema
>
export type StorefrontOrderListResponse = z.infer<typeof storefrontOrderListResponseSchema>
export type StorefrontOrderResponse = z.infer<typeof storefrontOrderResponseSchema>
export type StorefrontOrderTrackingLookup = z.infer<typeof storefrontOrderTrackingLookupSchema>
export type StorefrontPaymentConfig = z.infer<typeof storefrontPaymentConfigSchema>
export type StorefrontPaymentReconciliationPayload = z.infer<
  typeof storefrontPaymentReconciliationPayloadSchema
>
export type StorefrontPaymentReconciliationItem = z.infer<
  typeof storefrontPaymentReconciliationItemSchema
>
export type StorefrontPaymentReconciliationResponse = z.infer<
  typeof storefrontPaymentReconciliationResponseSchema
>
export type StorefrontPaymentSettlementItem = z.infer<
  typeof storefrontPaymentSettlementItemSchema
>
export type StorefrontPaymentExceptionItem = z.infer<
  typeof storefrontPaymentExceptionItemSchema
>
export type StorefrontPaymentWebhookExceptionItem = z.infer<
  typeof storefrontPaymentWebhookExceptionItemSchema
>
export type StorefrontRefundQueueItem = z.infer<
  typeof storefrontRefundQueueItemSchema
>
export type StorefrontRefundStatusUpdatePayload = z.infer<
  typeof storefrontRefundStatusUpdatePayloadSchema
>
export type StorefrontPaymentOperationsReport = z.infer<
  typeof storefrontPaymentOperationsReportSchema
>
export type StorefrontAdminOrderQueueBucket = z.infer<
  typeof storefrontAdminOrderQueueBucketSchema
>
export type StorefrontAdminOrderQueueItem = z.infer<
  typeof storefrontAdminOrderQueueItemSchema
>
export type StorefrontAdminOrderOperationsReport = z.infer<
  typeof storefrontAdminOrderOperationsReportSchema
>
export type StorefrontCommunicationTemplateCode = z.infer<
  typeof storefrontCommunicationTemplateCodeSchema
>
export type StorefrontCommunicationLogItem = z.infer<
  typeof storefrontCommunicationLogItemSchema
>
export type StorefrontCommunicationLogResponse = z.infer<
  typeof storefrontCommunicationLogResponseSchema
>
export type StorefrontCommunicationResendPayload = z.infer<
  typeof storefrontCommunicationResendPayloadSchema
>
export type StorefrontCommunicationResendResponse = z.infer<
  typeof storefrontCommunicationResendResponseSchema
>
export type StorefrontCommunicationHealthResponse = z.infer<
  typeof storefrontCommunicationHealthResponseSchema
>
export type StorefrontSupportCaseStatus = z.infer<typeof storefrontSupportCaseStatusSchema>
export type StorefrontSupportCasePriority = z.infer<typeof storefrontSupportCasePrioritySchema>
export type StorefrontSupportCaseCategory = z.infer<typeof storefrontSupportCaseCategorySchema>
export type StorefrontSupportCase = z.infer<typeof storefrontSupportCaseSchema>
export type StorefrontSupportCaseView = z.infer<typeof storefrontSupportCaseViewSchema>
export type StorefrontSupportCaseListResponse = z.infer<
  typeof storefrontSupportCaseListResponseSchema
>
export type StorefrontSupportCaseResponse = z.infer<
  typeof storefrontSupportCaseResponseSchema
>
export type StorefrontSupportCaseCreatePayload = z.infer<
  typeof storefrontSupportCaseCreatePayloadSchema
>
export type StorefrontSupportCaseAdminUpdatePayload = z.infer<
  typeof storefrontSupportCaseAdminUpdatePayloadSchema
>
export type StorefrontSupportQueueReport = z.infer<
  typeof storefrontSupportQueueReportSchema
>
export type StorefrontReceiptDocument = z.infer<typeof storefrontReceiptDocumentSchema>
export type StorefrontOrderRequestType = z.infer<typeof storefrontOrderRequestTypeSchema>
export type StorefrontOrderRequestStatus = z.infer<typeof storefrontOrderRequestStatusSchema>
export type StorefrontOrderRequest = z.infer<typeof storefrontOrderRequestSchema>
export type StorefrontOrderRequestView = z.infer<typeof storefrontOrderRequestViewSchema>
export type StorefrontOrderRequestListResponse = z.infer<
  typeof storefrontOrderRequestListResponseSchema
>
export type StorefrontOrderRequestResponse = z.infer<
  typeof storefrontOrderRequestResponseSchema
>
export type StorefrontOrderRequestCreatePayload = z.infer<
  typeof storefrontOrderRequestCreatePayloadSchema
>
export type StorefrontOrderRequestReviewPayload = z.infer<
  typeof storefrontOrderRequestReviewPayloadSchema
>
export type StorefrontOrderRequestQueueReport = z.infer<
  typeof storefrontOrderRequestQueueReportSchema
>
