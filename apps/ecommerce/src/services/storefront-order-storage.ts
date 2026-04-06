import type { Kysely } from "kysely"

import {
  storefrontOrderSchema,
  type StorefrontAddress,
  type StorefrontOrder,
  type StorefrontOrderItem,
  type StorefrontOrderTimelineEvent,
} from "../../shared/index.js"
import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"

import { ecommerceTableNames } from "../../database/table-names.js"

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizeRequiredString(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeStatus(value: unknown): StorefrontOrder["status"] {
  return value === "pending_payment" ||
    value === "confirmed" ||
    value === "processing" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled"
    ? value
    : "confirmed"
}

function normalizePaymentStatus(value: unknown): StorefrontOrder["paymentStatus"] {
  return value === "pending" || value === "paid" || value === "failed" || value === "refunded"
    ? value
    : "paid"
}

function normalizePaymentMode(value: unknown): StorefrontOrder["paymentMode"] {
  return value === "live" || value === "mock" ? value : "mock"
}

function normalizeTimelineEntry(
  value: unknown,
  orderId: string,
  index: number
): StorefrontOrderTimelineEvent | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  return {
    id: normalizeRequiredString(record.id, `timeline:${orderId}:${index + 1}`),
    code: normalizeRequiredString(record.code, index === 0 ? "order_created" : "order_updated"),
    label: normalizeRequiredString(record.label, index === 0 ? "Order created" : "Order updated"),
    summary: normalizeRequiredString(
      record.summary,
      index === 0
        ? "Order was created in the storefront."
        : "Order timeline was restored from a legacy record."
    ),
    createdAt: normalizeRequiredString(record.createdAt, new Date().toISOString()),
  }
}

function normalizeAddress(
  value: unknown,
  fallback: Partial<StorefrontAddress> = {}
): StorefrontAddress {
  const record = asRecord(value)

  return {
    fullName: normalizeRequiredString(record?.fullName, fallback.fullName ?? "Storefront customer"),
    email: normalizeRequiredString(record?.email, fallback.email ?? "customer@codexsun.local"),
    phoneNumber: normalizeRequiredString(record?.phoneNumber, fallback.phoneNumber ?? "0000000000"),
    line1: normalizeRequiredString(record?.line1, fallback.line1 ?? "Address pending"),
    line2: normalizeOptionalString(record?.line2 ?? fallback.line2 ?? null),
    city: normalizeRequiredString(record?.city, fallback.city ?? "Unknown city"),
    state: normalizeRequiredString(record?.state, fallback.state ?? "Unknown state"),
    country: normalizeRequiredString(record?.country, fallback.country ?? "India"),
    pincode: normalizeRequiredString(record?.pincode, fallback.pincode ?? "000000"),
  }
}

function normalizeOrderItem(value: unknown, index: number, orderId: string): StorefrontOrderItem | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const quantity = Math.max(1, Math.trunc(normalizeNumber(record.quantity, 1)))
  const unitPrice = Math.max(0, normalizeNumber(record.unitPrice, 0))
  const mrp = Math.max(unitPrice, normalizeNumber(record.mrp, unitPrice))

  return {
    id: normalizeRequiredString(record.id, `order-item:${orderId}:${index + 1}`),
    productId: normalizeRequiredString(record.productId, `legacy-product:${index + 1}`),
    slug: normalizeRequiredString(record.slug, `legacy-item-${index + 1}`),
    name: normalizeRequiredString(record.name, `Legacy item ${index + 1}`),
    brandName: normalizeOptionalString(record.brandName),
    imageUrl: normalizeOptionalString(record.imageUrl),
    quantity,
    unitPrice,
    mrp,
    lineTotal: Math.max(0, normalizeNumber(record.lineTotal, unitPrice * quantity)),
  }
}

function normalizeOrderRecord(value: unknown, index: number): StorefrontOrder | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const orderId = normalizeRequiredString(record.id, `storefront-order:legacy-${index + 1}`)
  const items = Array.isArray(record.items)
    ? record.items
        .map((item, itemIndex) => normalizeOrderItem(item, itemIndex, orderId))
        .filter((item): item is StorefrontOrderItem => item !== null)
    : []

  if (items.length === 0) {
    return null
  }

  const subtotalAmount = Math.max(
    0,
    normalizeNumber(
      record.subtotalAmount,
      items.reduce((sum, item) => sum + item.lineTotal, 0)
    )
  )
  const discountAmount = Math.max(
    0,
    normalizeNumber(
      record.discountAmount,
      items.reduce((sum, item) => sum + Math.max(0, (item.mrp - item.unitPrice) * item.quantity), 0)
    )
  )
  const shippingAmount = Math.max(0, normalizeNumber(record.shippingAmount, 0))
  const totalAmount = Math.max(
    subtotalAmount + shippingAmount,
    normalizeNumber(record.totalAmount, subtotalAmount + shippingAmount)
  )
  const shippingAddress = normalizeAddress(record.shippingAddress)
  const billingAddress = normalizeAddress(record.billingAddress, shippingAddress)
  const timeline = Array.isArray(record.timeline)
    ? record.timeline
        .map((entry, entryIndex) => normalizeTimelineEntry(entry, orderId, entryIndex))
        .filter((entry): entry is StorefrontOrderTimelineEvent => entry !== null)
    : []

  return storefrontOrderSchema.parse({
    id: orderId,
    orderNumber: normalizeRequiredString(record.orderNumber, `ECM-LEGACY-${String(index + 1).padStart(4, "0")}`),
    customerAccountId: normalizeOptionalString(record.customerAccountId),
    coreContactId: normalizeRequiredString(record.coreContactId, `contact:legacy-${index + 1}`),
    status: normalizeStatus(record.status),
    paymentStatus: normalizePaymentStatus(record.paymentStatus),
    paymentProvider: "razorpay",
    paymentMode: normalizePaymentMode(record.paymentMode),
    providerOrderId: normalizeOptionalString(record.providerOrderId),
    providerPaymentId: normalizeOptionalString(record.providerPaymentId),
    shippingAddress,
    billingAddress,
    items,
    itemCount: Math.max(1, Math.trunc(normalizeNumber(record.itemCount, items.reduce((sum, item) => sum + item.quantity, 0)))),
    subtotalAmount,
    discountAmount,
    shippingAmount,
    totalAmount,
    currency: normalizeRequiredString(record.currency, "INR"),
    notes: normalizeOptionalString(record.notes),
    timeline:
      timeline.length > 0
        ? timeline
        : [
            {
              id: `timeline:${orderId}:restored`,
              code: "order_created",
              label: "Order created",
              summary: "Order timeline was restored from a legacy storefront record.",
              createdAt: normalizeRequiredString(record.createdAt, new Date().toISOString()),
            },
          ],
    createdAt: normalizeRequiredString(record.createdAt, new Date().toISOString()),
    updatedAt: normalizeRequiredString(record.updatedAt, normalizeRequiredString(record.createdAt, new Date().toISOString())),
  })
}

export async function readStorefrontOrders(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<unknown>(database, ecommerceTableNames.orders)

  return items
    .map((item, index) => normalizeOrderRecord(item, index))
    .filter((item): item is StorefrontOrder => item !== null)
}
