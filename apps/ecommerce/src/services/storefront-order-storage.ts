import type { Kysely } from "kysely"

import {
  storefrontRefundRecordSchema,
  storefrontOrderSchema,
  type StorefrontAddress,
  type StorefrontOrder,
  type StorefrontOrderTaxBreakdown,
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

function normalizeAttributionChannel(value: unknown) {
  return value === "direct" ||
    value === "organic_search" ||
    value === "paid_search" ||
    value === "social" ||
    value === "email" ||
    value === "referral" ||
    value === "campaign" ||
    value === "marketplace" ||
    value === "unknown"
    ? value
    : "unknown"
}

function normalizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeStatus(value: unknown): StorefrontOrder["status"] {
  return value === "created" ||
    value === "payment_pending" ||
    value === "paid" ||
    value === "fulfilment_pending" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled" ||
    value === "refunded"
    ? value
    : value === "pending_payment"
      ? "payment_pending"
      : value === "confirmed" || value === "processing"
        ? "fulfilment_pending"
        : "payment_pending"
}

function normalizePaymentStatus(value: unknown): StorefrontOrder["paymentStatus"] {
  return value === "pending" || value === "paid" || value === "failed" || value === "refunded"
    ? value
    : "paid"
}

function normalizePaymentMode(value: unknown): StorefrontOrder["paymentMode"] {
  return value === "live" || value === "mock" || value === "offline" ? value : "mock"
}

function normalizePaymentProvider(value: unknown): StorefrontOrder["paymentProvider"] {
  return value === "store" || value === "razorpay" ? value : "razorpay"
}

function normalizeFulfillmentMethod(value: unknown): StorefrontOrder["fulfillmentMethod"] {
  return value === "store_pickup" || value === "delivery" ? value : "delivery"
}

function normalizePaymentCollectionMethod(
  value: unknown
): StorefrontOrder["paymentCollectionMethod"] {
  return value === "pay_at_store" || value === "online" ? value : "online"
}

function normalizePickupLocation(value: unknown): StorefrontOrder["pickupLocation"] {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  return {
    storeName: normalizeRequiredString(record.storeName, "Store pickup"),
    line1: normalizeRequiredString(record.line1, "Address pending"),
    line2: normalizeOptionalString(record.line2),
    city: normalizeRequiredString(record.city, "Unknown city"),
    state: normalizeRequiredString(record.state, "Unknown state"),
    country: normalizeRequiredString(record.country, "India"),
    pincode: normalizeRequiredString(record.pincode, "000000"),
    contactPhone: normalizeRequiredString(record.contactPhone, "0000000000"),
    contactEmail: normalizeRequiredString(record.contactEmail, "storefront@codexsun.local"),
    pickupNote: normalizeRequiredString(record.pickupNote, "Pickup note pending."),
  }
}

function normalizeShipmentDetails(value: unknown): StorefrontOrder["shipmentDetails"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  return {
    carrierName: normalizeOptionalString(record.carrierName),
    trackingId: normalizeOptionalString(record.trackingId),
    trackingUrl: normalizeOptionalString(record.trackingUrl),
    note: normalizeOptionalString(record.note),
    markedFulfilmentAt: normalizeOptionalString(record.markedFulfilmentAt),
    shippedAt: normalizeOptionalString(record.shippedAt),
    deliveredAt: normalizeOptionalString(record.deliveredAt),
    updatedAt: normalizeRequiredString(record.updatedAt, new Date().toISOString()),
  }
}

function normalizeShippingMethod(value: unknown): StorefrontOrder["shippingMethod"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  return {
    id: normalizeRequiredString(record.id, "shipping-method:legacy"),
    label: normalizeRequiredString(record.label, "Delivery"),
    description: normalizeRequiredString(record.description, "Legacy delivery method"),
    courierName: normalizeOptionalString(record.courierName),
    serviceLevel: normalizeRequiredString(record.serviceLevel, "Standard service"),
    etaMinDays: Math.max(0, Math.trunc(normalizeNumber(record.etaMinDays, 0))),
    etaMaxDays: Math.max(0, Math.trunc(normalizeNumber(record.etaMaxDays, 0))),
    shippingAmount: Math.max(0, normalizeNumber(record.shippingAmount, 0)),
    handlingAmount: Math.max(0, normalizeNumber(record.handlingAmount, 0)),
    freeShippingThreshold:
      record.freeShippingThreshold == null
        ? null
        : Math.max(0, normalizeNumber(record.freeShippingThreshold, 0)),
    codEligible: record.codEligible === true,
    isDefault: record.isDefault === true,
    isActive: record.isActive !== false,
  }
}

function normalizeShippingZone(value: unknown): StorefrontOrder["shippingZone"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  return {
    id: normalizeRequiredString(record.id, "shipping-zone:legacy"),
    label: normalizeRequiredString(record.label, "Default zone"),
    countries: Array.isArray(record.countries)
      ? record.countries.map((item) => normalizeRequiredString(item, "")).filter(Boolean)
      : [],
    states: Array.isArray(record.states)
      ? record.states.map((item) => normalizeRequiredString(item, "")).filter(Boolean)
      : [],
    pincodePrefixes: Array.isArray(record.pincodePrefixes)
      ? record.pincodePrefixes.map((item) => normalizeRequiredString(item, "")).filter(Boolean)
      : [],
    shippingSurchargeAmount: Math.max(0, normalizeNumber(record.shippingSurchargeAmount, 0)),
    handlingSurchargeAmount: Math.max(0, normalizeNumber(record.handlingSurchargeAmount, 0)),
    freeShippingThresholdOverride:
      record.freeShippingThresholdOverride == null
        ? null
        : Math.max(0, normalizeNumber(record.freeShippingThresholdOverride, 0)),
    etaAdditionalDays: Math.max(0, Math.trunc(normalizeNumber(record.etaAdditionalDays, 0))),
    codEligible: record.codEligible === true,
    isDefault: record.isDefault === true,
    isActive: record.isActive !== false,
  }
}

function normalizeStockReservation(
  value: unknown
): StorefrontOrder["stockReservation"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const items = Array.isArray(record.items)
    ? record.items
        .map((item) => {
          const itemRecord = asRecord(item)

          if (!itemRecord) {
            return null
          }

          const productId = normalizeOptionalString(itemRecord.productId)
          const stockItemId = normalizeOptionalString(itemRecord.stockItemId)
          const warehouseId = normalizeOptionalString(itemRecord.warehouseId)
          const quantity = Math.max(0, Math.trunc(normalizeNumber(itemRecord.quantity, 0)))

          if (!productId || !stockItemId || !warehouseId || quantity <= 0) {
            return null
          }

          return {
            productId,
            stockItemId,
            warehouseId,
            quantity,
          }
        })
        .filter(
          (
            item
          ): item is NonNullable<NonNullable<StorefrontOrder["stockReservation"]>["items"][number]> =>
            item !== null
        )
    : []

  if (items.length === 0) {
    return null
  }

  return {
    status: record.status === "released" ? "released" : "active",
    reservedAt: normalizeRequiredString(record.reservedAt, new Date().toISOString()),
    releasedAt: normalizeOptionalString(record.releasedAt),
    releaseReason: normalizeOptionalString(record.releaseReason),
    items,
  }
}

function normalizeAppliedCoupon(
  value: unknown
): StorefrontOrder["appliedCoupon"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const couponId = normalizeOptionalString(record.couponId)
  const code = normalizeOptionalString(record.code)
  const title = normalizeOptionalString(record.title)
  const discountLabel = normalizeOptionalString(record.discountLabel)

  if (!couponId || !code || !title || !discountLabel) {
    return null
  }

  return {
    couponId,
    code,
    title,
    discountType:
      record.discountType === "fixed_amount" || record.discountType === "free_shipping"
        ? record.discountType
        : "percentage",
    discountLabel,
    discountAmount: Math.max(0, normalizeNumber(record.discountAmount, 0)),
    reservedAt: normalizeRequiredString(record.reservedAt, new Date().toISOString()),
    releasedAt: normalizeOptionalString(record.releasedAt),
    releaseReason: normalizeOptionalString(record.releaseReason),
    usedAt: normalizeOptionalString(record.usedAt),
    status:
      record.status === "used" || record.status === "released"
        ? record.status
        : "reserved",
  }
}

function normalizeAttribution(
  value: unknown
): StorefrontOrder["attribution"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const source = normalizeOptionalString(record.source)

  if (!source) {
    return null
  }

  return {
    source,
    medium: normalizeOptionalString(record.medium),
    campaign: normalizeOptionalString(record.campaign),
    content: normalizeOptionalString(record.content),
    term: normalizeOptionalString(record.term),
    referrer: normalizeOptionalString(record.referrer),
    landingPath: normalizeOptionalString(record.landingPath),
    sessionKey: normalizeOptionalString(record.sessionKey),
    channel: normalizeAttributionChannel(record.channel),
    capturedAt: normalizeRequiredString(record.capturedAt, new Date().toISOString()),
  }
}

function normalizeRefundRecord(
  value: unknown,
  orderFallback: {
    totalAmount: number
    currency: string
    paymentStatus: StorefrontOrder["paymentStatus"]
    status: StorefrontOrder["status"]
    updatedAt: string
  }
): StorefrontOrder["refund"] {
  const record = asRecord(value)

  if (!record) {
    if (orderFallback.paymentStatus !== "refunded" && orderFallback.status !== "refunded") {
      return null
    }

    return storefrontRefundRecordSchema.parse({
      type: "full",
      status: "refunded",
      requestedAmount: orderFallback.totalAmount,
      currency: orderFallback.currency,
      reason: null,
      requestedBy: "system",
      requestedAt: null,
      initiatedAt: null,
      completedAt: orderFallback.updatedAt,
      failedAt: null,
      providerRefundId: null,
      statusSummary: "Refund state restored from a legacy storefront order record.",
      updatedAt: orderFallback.updatedAt,
    })
  }

  return storefrontRefundRecordSchema.parse({
    type: record.type === "partial" ? "partial" : "full",
    status:
      record.status === "requested" ||
      record.status === "queued" ||
      record.status === "processing" ||
      record.status === "refunded" ||
      record.status === "failed" ||
      record.status === "rejected" ||
      record.status === "none"
        ? record.status
        : orderFallback.paymentStatus === "refunded" || orderFallback.status === "refunded"
          ? "refunded"
          : "none",
    requestedAmount: Math.max(
      0,
      normalizeNumber(record.requestedAmount, orderFallback.totalAmount)
    ),
    currency: normalizeRequiredString(record.currency, orderFallback.currency),
    reason: normalizeOptionalString(record.reason),
    requestedBy:
      record.requestedBy === "admin" ||
      record.requestedBy === "customer" ||
      record.requestedBy === "system"
        ? record.requestedBy
        : "system",
    requestedAt: normalizeOptionalString(record.requestedAt),
    initiatedAt: normalizeOptionalString(record.initiatedAt),
    completedAt: normalizeOptionalString(record.completedAt),
    failedAt: normalizeOptionalString(record.failedAt),
    providerRefundId: normalizeOptionalString(record.providerRefundId),
    statusSummary: normalizeOptionalString(record.statusSummary),
    updatedAt: normalizeRequiredString(record.updatedAt, orderFallback.updatedAt),
  })
}

function normalizeTaxBreakdown(value: unknown): StorefrontOrderTaxBreakdown | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const lines = Array.isArray(record.lines)
    ? record.lines
        .map((entry) => {
          const line = asRecord(entry)

          if (!line) {
            return null
          }

          return {
            itemId: normalizeRequiredString(line.itemId, "order-item:legacy"),
            itemName: normalizeRequiredString(line.itemName, "Legacy item"),
            productId: normalizeRequiredString(line.productId, "legacy-product"),
            hsnCodeId: normalizeOptionalString(line.hsnCodeId),
            taxId: normalizeOptionalString(line.taxId),
            taxCode: normalizeOptionalString(line.taxCode),
            taxLabel: normalizeOptionalString(line.taxLabel),
            ratePercent: Math.max(0, normalizeNumber(line.ratePercent, 0)),
            taxableAmount: Math.max(0, normalizeNumber(line.taxableAmount, 0)),
            taxAmount: Math.max(0, normalizeNumber(line.taxAmount, 0)),
            cgstAmount: Math.max(0, normalizeNumber(line.cgstAmount, 0)),
            sgstAmount: Math.max(0, normalizeNumber(line.sgstAmount, 0)),
            igstAmount: Math.max(0, normalizeNumber(line.igstAmount, 0)),
            cessAmount: Math.max(0, normalizeNumber(line.cessAmount, 0)),
          }
        })
        .filter((entry): entry is NonNullable<StorefrontOrderTaxBreakdown["lines"][number]> => entry !== null)
    : []

  return {
    regime: record.regime === "intra_state" ? "intra_state" : "inter_state",
    pricesIncludeTax: record.pricesIncludeTax !== false,
    sellerState: normalizeRequiredString(record.sellerState, "Tamil Nadu"),
    customerState: normalizeRequiredString(record.customerState, "Unknown state"),
    taxableAmount: Math.max(0, normalizeNumber(record.taxableAmount, 0)),
    taxAmount: Math.max(0, normalizeNumber(record.taxAmount, 0)),
    cgstAmount: Math.max(0, normalizeNumber(record.cgstAmount, 0)),
    sgstAmount: Math.max(0, normalizeNumber(record.sgstAmount, 0)),
    igstAmount: Math.max(0, normalizeNumber(record.igstAmount, 0)),
    cessAmount: Math.max(0, normalizeNumber(record.cessAmount, 0)),
    shippingTaxAmount: Math.max(0, normalizeNumber(record.shippingTaxAmount, 0)),
    handlingTaxAmount: Math.max(0, normalizeNumber(record.handlingTaxAmount, 0)),
    lines,
  }
}

function normalizeErpSalesOrderLink(
  value: unknown
): StorefrontOrder["erpSalesOrderLink"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const connectorSyncId = normalizeOptionalString(record.connectorSyncId)

  if (!connectorSyncId) {
    return null
  }

  return {
    connectorSyncId,
    status: record.status === "synced" ? "synced" : "failed",
    salesOrderId: normalizeOptionalString(record.salesOrderId),
    salesOrderName: normalizeOptionalString(record.salesOrderName),
    source: normalizeRequiredString(record.source, "unknown"),
    lastAttemptedAt: normalizeRequiredString(record.lastAttemptedAt, new Date().toISOString()),
    syncedAt: normalizeOptionalString(record.syncedAt),
    failureMessage: normalizeOptionalString(record.failureMessage),
    updatedAt: normalizeRequiredString(record.updatedAt, new Date().toISOString()),
  }
}

function normalizeAppliedPromotion(
  value: unknown
): StorefrontOrder["appliedPromotion"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const promotionKey = normalizeOptionalString(record.promotionKey)
  const label = normalizeOptionalString(record.label)

  if (!promotionKey || !label) {
    return null
  }

  return {
    promotionKey,
    label,
    segmentKey:
      record.segmentKey === "repeat_customer" ||
      record.segmentKey === "vip" ||
      record.segmentKey === "at_risk" ||
      record.segmentKey === "dormant"
        ? record.segmentKey
        : "new_customer",
    source: record.source === "lifecycle_marketing" ? "lifecycle_marketing" : "segment_pricing",
    discountPercent: Math.max(0, normalizeNumber(record.discountPercent, 0)),
    discountAmount: Math.max(0, normalizeNumber(record.discountAmount, 0)),
    appliedAt: normalizeRequiredString(record.appliedAt, new Date().toISOString()),
  }
}

function normalizeErpDeliveryNoteLink(
  value: unknown
): StorefrontOrder["erpDeliveryNoteLink"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const connectorSyncId = normalizeOptionalString(record.connectorSyncId)

  if (!connectorSyncId) {
    return null
  }

  return {
    connectorSyncId,
    status: record.status === "synced" ? "synced" : "failed",
    deliveryNoteId: normalizeOptionalString(record.deliveryNoteId),
    deliveryNoteName: normalizeOptionalString(record.deliveryNoteName),
    shipmentReference: normalizeOptionalString(record.shipmentReference),
    source: normalizeRequiredString(record.source, "unknown"),
    lastAttemptedAt: normalizeRequiredString(record.lastAttemptedAt, new Date().toISOString()),
    syncedAt: normalizeOptionalString(record.syncedAt),
    failureMessage: normalizeOptionalString(record.failureMessage),
    updatedAt: normalizeRequiredString(record.updatedAt, new Date().toISOString()),
  }
}

function normalizeErpInvoiceLink(
  value: unknown
): StorefrontOrder["erpInvoiceLink"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const connectorSyncId = normalizeOptionalString(record.connectorSyncId)

  if (!connectorSyncId) {
    return null
  }

  return {
    connectorSyncId,
    status: record.status === "synced" ? "synced" : "failed",
    invoiceId: normalizeOptionalString(record.invoiceId),
    invoiceName: normalizeOptionalString(record.invoiceName),
    invoiceNumber: normalizeOptionalString(record.invoiceNumber),
    source: normalizeRequiredString(record.source, "unknown"),
    lastAttemptedAt: normalizeRequiredString(record.lastAttemptedAt, new Date().toISOString()),
    syncedAt: normalizeOptionalString(record.syncedAt),
    failureMessage: normalizeOptionalString(record.failureMessage),
    updatedAt: normalizeRequiredString(record.updatedAt, new Date().toISOString()),
  }
}

function normalizeErpReturnLink(
  value: unknown
): StorefrontOrder["erpReturnLink"] {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const connectorSyncId = normalizeOptionalString(record.connectorSyncId)

  if (!connectorSyncId) {
    return null
  }

  return {
    connectorSyncId,
    status: record.status === "synced" ? "synced" : "failed",
    returnId: normalizeOptionalString(record.returnId),
    returnName: normalizeOptionalString(record.returnName),
    creditNoteId: normalizeOptionalString(record.creditNoteId),
    creditNoteName: normalizeOptionalString(record.creditNoteName),
    returnStatus: normalizeOptionalString(record.returnStatus),
    source: normalizeRequiredString(record.source, "unknown"),
    lastAttemptedAt: normalizeRequiredString(record.lastAttemptedAt, new Date().toISOString()),
    syncedAt: normalizeOptionalString(record.syncedAt),
    failureMessage: normalizeOptionalString(record.failureMessage),
    updatedAt: normalizeRequiredString(record.updatedAt, new Date().toISOString()),
  }
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
    variantLabel: normalizeOptionalString(record.variantLabel),
    attributes: Array.isArray(record.attributes)
      ? record.attributes
          .map((attribute) => {
            const attributeRecord = asRecord(attribute)

            if (!attributeRecord) {
              return null
            }

            const name = normalizeOptionalString(attributeRecord.name)
            const value = normalizeOptionalString(attributeRecord.value)

            return name && value ? { name, value } : null
          })
          .filter((attribute): attribute is NonNullable<StorefrontOrderItem["attributes"][number]> => attribute !== null)
      : [],
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
  const handlingAmount = Math.max(0, normalizeNumber(record.handlingAmount, 0))
  const totalAmount = Math.max(
    subtotalAmount + shippingAmount + handlingAmount,
    normalizeNumber(record.totalAmount, subtotalAmount + shippingAmount + handlingAmount)
  )
  const shippingAddress = normalizeAddress(record.shippingAddress)
  const billingAddress = normalizeAddress(record.billingAddress, shippingAddress)
  const updatedAt = normalizeRequiredString(
    record.updatedAt,
    normalizeRequiredString(record.createdAt, new Date().toISOString())
  )
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
    paymentProvider: normalizePaymentProvider(record.paymentProvider),
    paymentMode: normalizePaymentMode(record.paymentMode),
    fulfillmentMethod: normalizeFulfillmentMethod(record.fulfillmentMethod),
    paymentCollectionMethod: normalizePaymentCollectionMethod(record.paymentCollectionMethod),
    pickupLocation: normalizePickupLocation(record.pickupLocation),
    shippingMethod: normalizeShippingMethod(record.shippingMethod),
    shippingZone: normalizeShippingZone(record.shippingZone),
    shipmentDetails: normalizeShipmentDetails(record.shipmentDetails),
    refund: normalizeRefundRecord(record.refund, {
      totalAmount,
      currency: normalizeRequiredString(record.currency, "INR"),
      paymentStatus: normalizePaymentStatus(record.paymentStatus),
      status: normalizeStatus(record.status),
      updatedAt,
    }),
    stockReservation: normalizeStockReservation(record.stockReservation),
    appliedCoupon: normalizeAppliedCoupon(record.appliedCoupon),
    appliedPromotion: normalizeAppliedPromotion(record.appliedPromotion),
    taxBreakdown: normalizeTaxBreakdown(record.taxBreakdown),
    erpSalesOrderLink: normalizeErpSalesOrderLink(record.erpSalesOrderLink),
    erpDeliveryNoteLink: normalizeErpDeliveryNoteLink(record.erpDeliveryNoteLink),
    erpInvoiceLink: normalizeErpInvoiceLink(record.erpInvoiceLink),
    erpReturnLink: normalizeErpReturnLink(record.erpReturnLink),
    providerOrderId: normalizeOptionalString(record.providerOrderId),
    providerPaymentId: normalizeOptionalString(record.providerPaymentId),
    checkoutFingerprint: normalizeOptionalString(record.checkoutFingerprint),
    attribution: normalizeAttribution(record.attribution),
    shippingAddress,
    billingAddress,
    items,
    itemCount: Math.max(1, Math.trunc(normalizeNumber(record.itemCount, items.reduce((sum, item) => sum + item.quantity, 0)))),
    subtotalAmount,
    discountAmount,
    shippingAmount,
    handlingAmount,
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
    updatedAt,
  })
}

export async function readStorefrontOrders(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<unknown>(database, ecommerceTableNames.orders)

  return items
    .map((item, index) => normalizeOrderRecord(item, index))
    .filter((item): item is StorefrontOrder => item !== null)
}
