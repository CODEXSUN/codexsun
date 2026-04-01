import { z } from 'zod'
import { storefrontOrderSchema } from './storefront'

export const commerceOrderStatusSchema = z.enum([
  'pending_payment',
  'placed',
  'paid',
  'preparing_delivery',
  'packed',
  'courier_assigned',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_confirmed',
  'cancelled',
])

export const commerceOrderEventTypeSchema = z.enum([
  'order_received',
  'payment_pending',
  'payment_captured',
  'prepare_delivery',
  'packed',
  'courier_assigned',
  'picked_up',
  'estimated_delivery_updated',
  'tracking_updated',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_confirmed',
  'invoice_issued',
  'invoice_paid',
  'accounting_posted',
  'cancelled',
])

export const commerceShipmentStatusSchema = z.enum([
  'pending',
  'preparing',
  'packed',
  'courier_assigned',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_confirmed',
  'cancelled',
])

export const commerceInvoiceStatusSchema = z.enum(['draft', 'issued', 'paid', 'cancelled'])

export const commerceOrderEventSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  eventType: commerceOrderEventTypeSchema,
  title: z.string().min(1),
  description: z.string().nullable(),
  statusAfter: commerceOrderStatusSchema,
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  occurredAt: z.string().min(1),
  createdAt: z.string().min(1),
})

export const commerceShipmentSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  shipmentNumber: z.string().min(1),
  status: commerceShipmentStatusSchema,
  courierName: z.string().nullable(),
  courierService: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  trackingUrl: z.string().nullable(),
  pickupRequestedAt: z.string().nullable(),
  pickedUpAt: z.string().nullable(),
  estimatedDeliveryAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  deliveryConfirmedAt: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const commerceShipmentEventSchema = z.object({
  id: z.string().min(1),
  shipmentId: z.string().min(1),
  orderId: z.string().min(1),
  eventType: commerceOrderEventTypeSchema,
  title: z.string().min(1),
  description: z.string().nullable(),
  locationName: z.string().nullable(),
  eventTime: z.string().min(1),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  createdAt: z.string().min(1),
})

export const commerceInvoiceItemSchema = z.object({
  id: z.string().min(1),
  invoiceId: z.string().min(1),
  orderItemId: z.string().min(1),
  productId: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
})

export const commerceInvoiceSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  status: commerceInvoiceStatusSchema,
  issueDate: z.string().min(1),
  dueDate: z.string().nullable(),
  subtotal: z.number().nonnegative(),
  shippingAmount: z.number().nonnegative(),
  handlingAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  currency: z.string().min(1),
  paymentStatus: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  items: z.array(commerceInvoiceItemSchema),
})

export const accountingVoucherLineSchema = z.object({
  id: z.string().min(1),
  voucherId: z.string().min(1),
  ledgerCode: z.string().min(1),
  ledgerName: z.string().min(1),
  debitAmount: z.number().nonnegative(),
  creditAmount: z.number().nonnegative(),
  narration: z.string().nullable(),
})

export const accountingVoucherSchema = z.object({
  id: z.string().min(1),
  sourceType: z.string().min(1),
  sourceId: z.string().min(1),
  voucherType: z.string().min(1),
  voucherNumber: z.string().min(1),
  postingDate: z.string().min(1),
  effectiveDate: z.string().min(1),
  memo: z.string().nullable(),
  createdAt: z.string().min(1),
  lines: z.array(accountingVoucherLineSchema),
})

export const commerceOrderWorkflowSchema = z.object({
  order: storefrontOrderSchema,
  events: z.array(commerceOrderEventSchema),
  shipment: commerceShipmentSchema.nullable(),
  shipmentEvents: z.array(commerceShipmentEventSchema),
  invoice: commerceInvoiceSchema.nullable(),
  accountingVouchers: z.array(accountingVoucherSchema),
})

export const commerceOrderSummarySchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  customerName: z.string().min(1),
  status: commerceOrderStatusSchema,
  paymentStatus: z.string().min(1),
  shipmentStatus: commerceShipmentStatusSchema.nullable(),
  invoiceStatus: commerceInvoiceStatusSchema.nullable(),
  totalAmount: z.number().nonnegative(),
  currency: z.string().min(1),
  createdAt: z.string().min(1),
})

export const commerceOrderListResponseSchema = z.object({
  items: z.array(commerceOrderSummarySchema),
})

export const commerceOrderWorkflowResponseSchema = z.object({
  workflow: commerceOrderWorkflowSchema,
})

export const commerceWorkflowActionPayloadSchema = z.object({
  eventType: commerceOrderEventTypeSchema,
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullish(),
  courierName: z.string().trim().nullish(),
  courierService: z.string().trim().nullish(),
  trackingNumber: z.string().trim().nullish(),
  trackingUrl: z.string().trim().nullish(),
  locationName: z.string().trim().nullish(),
  estimatedDeliveryAt: z.string().trim().nullish(),
  eventTime: z.string().trim().nullish(),
  notes: z.string().trim().nullish(),
})

export const printableDocumentResponseSchema = z.object({
  fileName: z.string().min(1),
  mediaType: z.literal('text/html'),
  html: z.string().min(1),
})

export type CommerceOrderStatus = z.infer<typeof commerceOrderStatusSchema>
export type CommerceOrderEventType = z.infer<typeof commerceOrderEventTypeSchema>
export type CommerceShipmentStatus = z.infer<typeof commerceShipmentStatusSchema>
export type CommerceInvoiceStatus = z.infer<typeof commerceInvoiceStatusSchema>
export type CommerceOrderEvent = z.infer<typeof commerceOrderEventSchema>
export type CommerceShipment = z.infer<typeof commerceShipmentSchema>
export type CommerceShipmentEvent = z.infer<typeof commerceShipmentEventSchema>
export type CommerceInvoiceItem = z.infer<typeof commerceInvoiceItemSchema>
export type CommerceInvoice = z.infer<typeof commerceInvoiceSchema>
export type AccountingVoucherLine = z.infer<typeof accountingVoucherLineSchema>
export type AccountingVoucher = z.infer<typeof accountingVoucherSchema>
export type CommerceOrderWorkflow = z.infer<typeof commerceOrderWorkflowSchema>
export type CommerceOrderSummary = z.infer<typeof commerceOrderSummarySchema>
export type CommerceOrderListResponse = z.infer<typeof commerceOrderListResponseSchema>
export type CommerceOrderWorkflowResponse = z.infer<typeof commerceOrderWorkflowResponseSchema>
export type CommerceWorkflowActionPayload = z.infer<typeof commerceWorkflowActionPayloadSchema>
export type PrintableDocumentResponse = z.infer<typeof printableDocumentResponseSchema>
