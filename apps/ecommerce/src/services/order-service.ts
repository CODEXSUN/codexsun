import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { recordMonitoringEvent } from "../../../framework/src/runtime/monitoring/monitoring-service.js"
import { listCommonModuleItems } from "../../../core/src/services/common-module-service.js"
import {
  createContact,
  getContact,
  listContacts,
} from "../../../core/src/services/contact-service.js"
import { coreTableNames } from "../../../core/database/table-names.js"
import { type Product } from "../../../core/shared/index.js"
import {
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { AuthUser } from "../../../cxapp/shared/schemas/auth.js"
import { createMailboxService } from "../../../cxapp/src/services/service-factory.js"
import {
  storefrontAdminOrderActionPayloadSchema,
  storefrontAdminOrderOperationsReportSchema,
  storefrontReceiptDocumentSchema,
  storefrontCheckoutPayloadSchema,
  storefrontCheckoutResponseSchema,
  storefrontOrderListResponseSchema,
  storefrontOrderResponseSchema,
  storefrontOrderSchema,
  storefrontPaymentOperationsReportSchema,
  storefrontOperationalAgingReportSchema,
  storefrontAccountingCompatibilityReportSchema,
  storefrontOverviewKpiReportSchema,
  storefrontPaymentDailySummaryDocumentSchema,
  storefrontPaymentDailySummaryReportSchema,
  storefrontFailedPaymentReportDocumentSchema,
  storefrontRefundReportDocumentSchema,
  storefrontSettlementGapReportDocumentSchema,
  storefrontRefundStatusUpdatePayloadSchema,
  storefrontOrderTrackingLookupSchema,
  storefrontRefundRequestPayloadSchema,
  storefrontPaymentWebhookEventSchema,
  storefrontPaymentReconciliationPayloadSchema,
  storefrontPaymentReconciliationResponseSchema,
  storefrontPaymentVerificationPayloadSchema,
  type StorefrontSettings,
  type StorefrontPaymentSession,
  type StorefrontPaymentDailySummaryItem,
  type StorefrontRefundRecord,
  type CustomerAccount,
  type StorefrontAdminOrderActionPayload,
  type StorefrontAdminOrderQueueBucket,
  type StorefrontAdminOrderQueueItem,
  type StorefrontAddress,
  type StorefrontOrder,
  type StorefrontOrderTaxBreakdown,
  type StorefrontPaymentExceptionItem,
  type StorefrontPaymentSettlementItem,
  type StorefrontPaymentWebhookEvent,
  type StorefrontPaymentWebhookExceptionItem,
  type StorefrontPaymentReconciliationItem,
  type StorefrontOperationalAgingBucket,
  type StorefrontOperationalAgingReport,
  type StorefrontAccountingCompatibilityItem,
  type StorefrontAccountingCompatibilityReport,
  type StorefrontAppliedCoupon,
  type StorefrontOverviewKpiReport,
  type StorefrontStockReservation,
  type StorefrontRefundQueueItem,
  type StorefrontFulfilmentAgingItem,
  type StorefrontRefundAgingItem,
  type StorefrontOrderStatus,
  type StorefrontOrderTimelineEvent,
  type StorefrontShipmentDetails,
} from "../../shared/index.js"

import {
  createRazorpayPaymentSession,
  fetchRazorpayOrderPayments,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "./razorpay-service.js"
import {
  consumeCustomerPortalCoupon,
  readCustomerAccounts,
  releaseCustomerPortalCoupon,
  reserveCustomerPortalCoupon,
  resolveAuthenticatedCustomerAccount,
} from "./customer-service.js"
import { readCoreProducts } from "./catalog-service.js"
import { getStorefrontSettings } from "./storefront-settings-service.js"
import {
  sendStorefrontOrderConfirmedEmail,
  sendStorefrontPaymentFailedEmail,
} from "./storefront-mail-service.js"
import { readStorefrontOrders } from "./storefront-order-storage.js"
import {
  readStorefrontPaymentWebhookEvents,
  writeStorefrontPaymentWebhookEvents,
} from "./storefront-webhook-event-storage.js"

import { ecommerceTableNames } from "../../database/table-names.js"

const systemActor: AuthUser = {
  id: "auth-user:ecommerce-system",
  email: "storefront@codexsun.local",
  phoneNumber: "0000000000",
  displayName: "Ecommerce System",
  actorType: "admin",
  isSuperAdmin: false,
  avatarUrl: null,
  isActive: true,
  organizationName: "Codexsun",
  roles: [],
  permissions: [],
  createdAt: "2026-04-04T10:00:00.000Z",
  updatedAt: "2026-04-04T10:00:00.000Z",
}

const pendingReservationWindowMs = 15 * 60 * 1000

function buildMonitoringErrorContext(error: unknown) {
  if (error instanceof ApplicationError) {
    return {
      detail: error.message,
      statusCode: error.statusCode,
      ...error.context,
    }
  }

  if (error instanceof Error) {
    return {
      detail: error.message,
    }
  }

  return {
    detail: "Unknown error",
  }
}

async function recordCommerceMonitoringEvent(
  database: Kysely<unknown>,
  input: {
    operation: "checkout" | "payment_verify" | "webhook" | "order_creation"
    status: "success" | "failure"
    message: string
    referenceId?: string | null
    context?: Record<string, unknown> | null
  }
) {
  await recordMonitoringEvent(database, {
    sourceApp: "ecommerce",
    operation: input.operation,
    status: input.status,
    message: input.message,
    referenceId: input.referenceId ?? null,
    context: input.context ?? null,
  })
}

function normalizeOptionalString(value: string | null | undefined) {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function readOrders(database: Kysely<unknown>) {
  return readStorefrontOrders(database)
}

async function writeOrders(database: Kysely<unknown>, items: StorefrontOrder[]) {
  await replaceJsonStoreRecords(
    database,
    ecommerceTableNames.orders,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "storefront-order",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

async function writeCoreProducts(database: Kysely<unknown>, products: Product[]) {
  await replaceJsonStoreRecords(
    database,
    coreTableNames.products,
    products.map((product, index) => ({
      id: product.id,
      moduleKey: "products",
      sortOrder: index + 1,
      payload: product,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))
  )
}

function orderBelongsToCustomer(order: StorefrontOrder, customer: CustomerAccount) {
  if (order.customerAccountId === customer.id) {
    return true
  }

  const customerEmail = customer.email.trim().toLowerCase()
  const shippingEmail = order.shippingAddress.email.trim().toLowerCase()

  return (
    order.coreContactId === customer.coreContactId ||
    shippingEmail === customerEmail
  )
}

function createTimelineEvent(
  code: string,
  label: string,
  summary: string
): StorefrontOrderTimelineEvent {
  return {
    id: `timeline:${randomUUID()}`,
    code,
    label,
    summary,
    createdAt: new Date().toISOString(),
  }
}

function getOrderAgeMs(order: StorefrontOrder) {
  const ageMs = Date.now() - new Date(order.createdAt).getTime()
  return Number.isFinite(ageMs) ? ageMs : Number.POSITIVE_INFINITY
}

function isPendingReservationOrder(order: StorefrontOrder) {
  return (
    order.status === "payment_pending" &&
    order.paymentStatus === "pending" &&
    order.stockReservation?.status === "active"
  )
}

function isExpiredPendingReservationOrder(order: StorefrontOrder) {
  return isPendingReservationOrder(order) && getOrderAgeMs(order) > pendingReservationWindowMs
}

function buildRefundRecord(
  order: StorefrontOrder,
  overrides: Partial<StorefrontRefundRecord>
): StorefrontRefundRecord {
  const fallbackRequestedAmount =
    overrides.type === "partial"
      ? Math.min(order.totalAmount, Math.max(0, overrides.requestedAmount ?? order.totalAmount))
      : order.totalAmount

  return {
    type: overrides.type ?? "full",
    status: overrides.status ?? "none",
    requestedAmount: fallbackRequestedAmount,
    currency: overrides.currency ?? order.currency,
    reason: overrides.reason ?? null,
    requestedBy: overrides.requestedBy ?? "system",
    requestedAt: overrides.requestedAt ?? null,
    initiatedAt: overrides.initiatedAt ?? null,
    completedAt: overrides.completedAt ?? null,
    failedAt: overrides.failedAt ?? null,
    providerRefundId: overrides.providerRefundId ?? null,
    statusSummary: overrides.statusSummary ?? null,
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  }
}

function resolveSellableQuantity(product: Product) {
  return product.stockItems
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + Math.max(0, item.quantity - item.reservedQuantity), 0)
}

function applyReservationToProducts(
  products: Product[],
  orderItems: StorefrontOrder["items"],
  timestamp: string
) {
  const nextProducts = products.map((product) => ({
    ...product,
    stockItems: product.stockItems.map((item) => ({ ...item })),
  }))
  const reservationItems: StorefrontStockReservation["items"] = []

  for (const orderItem of orderItems) {
    const product = nextProducts.find((item) => item.id === orderItem.productId && item.isActive)

    if (!product) {
      throw new ApplicationError(
        "A reserved checkout item could not be found in the storefront catalog.",
        { productId: orderItem.productId },
        404
      )
    }

    let remainingQuantity = orderItem.quantity

    for (const stockItem of product.stockItems) {
      if (!stockItem.isActive) {
        continue
      }

      const availableQuantity = Math.max(0, stockItem.quantity - stockItem.reservedQuantity)

      if (availableQuantity <= 0) {
        continue
      }

      const allocatedQuantity = Math.min(remainingQuantity, availableQuantity)

      if (allocatedQuantity <= 0) {
        continue
      }

      stockItem.reservedQuantity += allocatedQuantity
      stockItem.updatedAt = timestamp
      reservationItems.push({
        productId: product.id,
        stockItemId: stockItem.id,
        warehouseId: stockItem.warehouseId,
        quantity: allocatedQuantity,
      })
      remainingQuantity -= allocatedQuantity

      if (remainingQuantity <= 0) {
        break
      }
    }

    if (remainingQuantity > 0) {
      throw new ApplicationError(
        "Requested quantity is not available for checkout.",
        {
          productId: product.id,
          requestedQuantity: orderItem.quantity,
          availableQuantity: resolveSellableQuantity(product),
        },
        409
      )
    }

    product.updatedAt = timestamp
  }

  return {
    products: nextProducts,
    reservation:
      reservationItems.length > 0
        ? ({
            status: "active",
            reservedAt: timestamp,
            releasedAt: null,
            releaseReason: null,
            items: reservationItems,
          } satisfies StorefrontStockReservation)
        : null,
  }
}

function releaseReservationFromProducts(
  products: Product[],
  reservation: NonNullable<StorefrontOrder["stockReservation"]>,
  timestamp: string
) {
  const nextProducts = products.map((product) => ({
    ...product,
    stockItems: product.stockItems.map((item) => ({ ...item })),
  }))

  for (const reservedItem of reservation.items) {
    const product = nextProducts.find((item) => item.id === reservedItem.productId)

    if (!product) {
      continue
    }

    const stockItem = product.stockItems.find((item) => item.id === reservedItem.stockItemId)

    if (!stockItem) {
      continue
    }

    stockItem.reservedQuantity = Math.max(0, stockItem.reservedQuantity - reservedItem.quantity)
    stockItem.updatedAt = timestamp
    product.updatedAt = timestamp
  }

  return nextProducts
}

async function releaseOrderReservation(
  database: Kysely<unknown>,
  order: StorefrontOrder,
  releaseReason: string,
  timestamp = new Date().toISOString()
) {
  if (!order.stockReservation || order.stockReservation.status !== "active") {
    return order
  }

  const products = await readCoreProducts(database)
  const nextProducts = releaseReservationFromProducts(products, order.stockReservation, timestamp)
  await writeCoreProducts(database, nextProducts)

  return storefrontOrderSchema.parse({
    ...order,
    stockReservation: {
      ...order.stockReservation,
      status: "released",
      releasedAt: timestamp,
      releaseReason,
    },
    updatedAt: timestamp,
  })
}

async function releaseOrderCoupon(
  database: Kysely<unknown>,
  order: StorefrontOrder,
  account: CustomerAccount | null,
  releaseReason: string,
  timestamp = new Date().toISOString()
) {
  if (!order.appliedCoupon || order.appliedCoupon.status !== "reserved") {
    return order
  }

  await releaseCustomerPortalCoupon(database, account, order.appliedCoupon.couponId, order.id)

  return storefrontOrderSchema.parse({
    ...order,
    appliedCoupon: {
      ...order.appliedCoupon,
      status: "released",
      releasedAt: timestamp,
      releaseReason,
    },
    updatedAt: timestamp,
  })
}

async function consumeOrderCoupon(
  database: Kysely<unknown>,
  order: StorefrontOrder,
  account: CustomerAccount | null,
  timestamp = new Date().toISOString()
) {
  if (!order.appliedCoupon || order.appliedCoupon.status !== "reserved") {
    return order
  }

  await consumeCustomerPortalCoupon(database, account, order.appliedCoupon.couponId, order.id)

  return storefrontOrderSchema.parse({
    ...order,
    appliedCoupon: {
      ...order.appliedCoupon,
      status: "used",
      usedAt: timestamp,
    },
    updatedAt: timestamp,
  })
}

async function expireStalePendingReservations(
  database: Kysely<unknown>,
  orders: StorefrontOrder[]
) {
  const staleOrders = orders.filter((order) => isExpiredPendingReservationOrder(order))

  if (staleOrders.length === 0) {
    return orders
  }

  const timestamp = new Date().toISOString()
  let products = await readCoreProducts(database)
  const customerAccounts = await readCustomerAccounts(database)
  const staleOrderIds = new Set(staleOrders.map((order) => order.id))
  const nextOrders = await Promise.all(orders.map(async (order) => {
    if (!staleOrderIds.has(order.id) || !order.stockReservation) {
      return order
    }

    products = releaseReservationFromProducts(products, order.stockReservation, timestamp)
    const account =
      order.customerAccountId
        ? customerAccounts.find((item) => item.id === order.customerAccountId) ?? null
        : null
    const couponReleasedOrder = await releaseOrderCoupon(
      database,
      storefrontOrderSchema.parse({
        ...transitionOrderStatus(order, "cancelled"),
        paymentStatus: "failed",
        stockReservation: {
          ...order.stockReservation,
          status: "released",
          releasedAt: timestamp,
          releaseReason: "payment_pending_expired",
        },
        timeline: [
          ...order.timeline,
          createTimelineEvent(
            "stock_reservation_expired",
            "Reservation expired",
            "The payment window expired before completion, so the reserved stock was released."
          ),
        ],
        updatedAt: timestamp,
      }),
      account,
      "payment_pending_expired",
      timestamp
    )

    return storefrontOrderSchema.parse({
      ...couponReleasedOrder,
      timeline: couponReleasedOrder.timeline,
      updatedAt: timestamp,
    })
  }))

  await writeCoreProducts(database, products)
  await writeOrders(database, nextOrders)

  return nextOrders
}

type RazorpayWebhookPayload = {
  event?: string
  created_at?: number
  payload?: {
    payment?: {
      entity?: {
        id?: string
        order_id?: string
        status?: string
        amount?: number
        currency?: string
        notes?: {
          storefrontOrderId?: string
        }
        error_description?: string
      }
    }
    order?: {
      entity?: {
        id?: string
        receipt?: string
        notes?: {
          storefrontOrderId?: string
        }
      }
    }
    refund?: {
      entity?: {
        id?: string
        payment_id?: string
        notes?: {
          storefrontOrderId?: string
        }
      }
    }
  }
}

const allowedOrderTransitions: Record<StorefrontOrderStatus, StorefrontOrderStatus[]> = {
  created: ["payment_pending", "cancelled"],
  payment_pending: ["paid", "cancelled", "refunded"],
  paid: ["fulfilment_pending", "cancelled", "refunded"],
  fulfilment_pending: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "cancelled", "refunded"],
  delivered: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
}

function transitionOrderStatus(
  order: StorefrontOrder,
  nextStatus: StorefrontOrderStatus
) {
  if (order.status === nextStatus) {
    return order
  }

  if (!allowedOrderTransitions[order.status].includes(nextStatus)) {
    throw new ApplicationError(
      "Order status transition is invalid.",
      {
        orderId: order.id,
        currentStatus: order.status,
        nextStatus,
      },
      409
    )
  }

  return storefrontOrderSchema.parse({
    ...order,
    status: nextStatus,
  })
}

function normalizeFingerprintText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
}

function buildCheckoutFingerprint(input: {
  coreContactId: string
  fulfillmentMethod: StorefrontOrder["fulfillmentMethod"]
  paymentCollectionMethod: StorefrontOrder["paymentCollectionMethod"]
  shippingAddress: StorefrontOrder["shippingAddress"]
  billingAddress: StorefrontOrder["billingAddress"]
  items: StorefrontOrder["items"]
  notes: string | null
}) {
  const itemSignature = [...input.items]
    .map((item) => `${item.productId}:${item.quantity}:${item.unitPrice}`)
    .sort()
    .join("|")
  const addressSignature = [
    normalizeFingerprintText(input.shippingAddress.fullName),
    normalizeFingerprintText(input.shippingAddress.email),
    normalizeFingerprintText(input.shippingAddress.phoneNumber),
    normalizeFingerprintText(input.shippingAddress.line1),
    normalizeFingerprintText(input.shippingAddress.line2),
    normalizeFingerprintText(input.shippingAddress.city),
    normalizeFingerprintText(input.shippingAddress.state),
    normalizeFingerprintText(input.shippingAddress.country),
    normalizeFingerprintText(input.shippingAddress.pincode),
    normalizeFingerprintText(input.billingAddress.line1),
    normalizeFingerprintText(input.billingAddress.line2),
    normalizeFingerprintText(input.billingAddress.city),
    normalizeFingerprintText(input.billingAddress.state),
    normalizeFingerprintText(input.billingAddress.country),
    normalizeFingerprintText(input.billingAddress.pincode),
  ].join("|")

  return [
    input.coreContactId,
    input.fulfillmentMethod,
    input.paymentCollectionMethod,
    addressSignature,
    itemSignature,
    normalizeFingerprintText(input.notes),
  ].join("::")
}

function buildPaymentSessionFromExistingOrder(
  config: ServerConfig,
  settings: StorefrontSettings,
  order: StorefrontOrder
) {
  if (order.paymentCollectionMethod === "pay_at_store" || order.paymentProvider === "store") {
    return storefrontCheckoutResponseSchema.shape.payment.parse({
      provider: "offline",
      mode: "offline",
      keyId: null,
      providerOrderId: null,
      amount: order.totalAmount,
      currency: order.currency,
      receipt: order.orderNumber,
      businessName: order.pickupLocation?.storeName ?? settings.pickupLocation.storeName,
      checkoutImage: null,
      themeColor: null,
    })
  }

  const amount = Math.round(order.totalAmount * 100)
  const businessName = config.commerce?.razorpay?.businessName ?? "Tirupur Direct"
  const checkoutImage = config.commerce?.razorpay?.checkoutImage ?? null
  const themeColor = config.commerce?.razorpay?.themeColor ?? null

  return storefrontCheckoutResponseSchema.shape.payment.parse({
    provider: "razorpay",
    mode: order.paymentMode,
    keyId: order.paymentMode === "offline" ? null : (config.commerce?.razorpay?.keyId ?? null),
    providerOrderId: order.providerOrderId,
    amount,
    currency: order.currency,
    receipt: order.orderNumber,
    businessName,
    checkoutImage,
    themeColor,
  })
}

function resolveContactTypeId(gstin: string | null) {
  return gstin
    ? "contact-type:registered-customer-b2b"
    : "contact-type:unregistered-customer-b2c"
}

async function resolveCheckoutContactId(
  database: Kysely<unknown>,
  customer: CustomerAccount | null,
  shippingAddress: {
    fullName: string
    email: string
    phoneNumber: string
    line1: string
    line2: string | null
    state: string
  }
) {
  if (customer) {
    return customer.coreContactId
  }

  const contacts = await listContacts(database)
  const existing = contacts.items.find(
    (item) =>
      item.primaryEmail?.toLowerCase() === shippingAddress.email.toLowerCase() ||
      item.primaryPhone?.trim() === shippingAddress.phoneNumber.trim()
  )

  if (existing) {
    return existing.id
  }

  const created = await createContact(database, systemActor, {
    code: "",
    contactTypeId: resolveContactTypeId(null),
    ledgerId: null,
    ledgerName: null,
    name: shippingAddress.fullName,
    legalName: "",
    pan: "",
    gstin: "",
    msmeType: "",
    msmeNo: "",
    openingBalance: 0,
    balanceType: "",
    creditLimit: 0,
    website: "",
    description: "Guest storefront checkout contact.",
    isActive: true,
    addresses: [
      {
        addressTypeId: "address-type:shipping",
        addressLine1: shippingAddress.line1,
        addressLine2: shippingAddress.line2 ?? "",
        cityId: null,
        districtId: null,
        stateId: null,
        countryId: null,
        pincodeId: null,
        latitude: null,
        longitude: null,
        isDefault: true,
      },
    ],
    emails: [{ email: shippingAddress.email, emailType: "primary", isPrimary: true }],
    phones: [
      {
        phoneNumber: shippingAddress.phoneNumber,
        phoneType: "mobile",
        isPrimary: true,
      },
    ],
    bankAccounts: [],
    gstDetails: [],
  })

  return created.item.id
}

function resolveProductPricing(
  product: Product
) {
  const activePrice = product.prices.find((item) => item.isActive) ?? product.prices[0]

  return {
    unitPrice: activePrice?.sellingPrice ?? product.basePrice,
    mrp:
      activePrice?.mrp ??
      Math.max(product.basePrice, activePrice?.sellingPrice ?? product.basePrice),
    availableQuantity: resolveSellableQuantity(product),
  }
}

function resolveOrderItemImage(product: Product) {
  const activeVariants = product.variants.filter((item) => item.isActive)
  const singleVariant = activeVariants.length === 1 ? (activeVariants[0] ?? null) : null

  if (singleVariant) {
    const variantImage =
      singleVariant.images.find((item) => item.isActive && item.isPrimary) ??
      singleVariant.images.find((item) => item.isActive) ??
      null

    if (variantImage?.imageUrl) {
      return variantImage.imageUrl
    }
  }

  return product.primaryImageUrl
}

function resolveOrderItemVariantLabel(product: Product) {
  const activeVariants = product.variants.filter((item) => item.isActive)
  const singleVariant = activeVariants.length === 1 ? (activeVariants[0] ?? null) : null

  if (singleVariant) {
    return normalizeOptionalString(singleVariant.variantName)
  }

  return product.hasVariants ? null : "Standard"
}

function resolveOrderItemAttributes(product: Product) {
  const activeVariants = product.variants.filter((item) => item.isActive)
  const sourceVariant = activeVariants.length === 1 ? (activeVariants[0] ?? null) : null
  const entries: Array<{ name: string; value: string }> = []
  const seen = new Set<string>()

  function addAttribute(name: string, value: string | null | undefined) {
    const normalizedValue = normalizeOptionalString(value)

    if (!normalizedValue) {
      return
    }

    const key = `${name.trim().toLowerCase()}:${normalizedValue.trim().toLowerCase()}`

    if (seen.has(key)) {
      return
    }

    seen.add(key)
    entries.push({ name, value: normalizedValue })
  }

  for (const attribute of sourceVariant?.attributes ?? []) {
    if (attribute.isActive) {
      addAttribute(attribute.attributeName, attribute.attributeValue)
    }
  }

  addAttribute("Fabric", product.storefront?.fabric)
  addAttribute("Fit", product.storefront?.fit)
  addAttribute("Sleeve", product.storefront?.sleeve)
  addAttribute("Occasion", product.storefront?.occasion)

  return entries.slice(0, 4)
}

function nextOrderNumber(existingOrders: StorefrontOrder[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const countForToday =
    existingOrders.filter((item) => item.orderNumber.includes(today)).length + 1

  return `ECM-${today}-${String(countForToday).padStart(4, "0")}`
}

function calculateChargeTotals(
  items: Array<{
    quantity: number
    shippingCharge: number | null | undefined
    handlingCharge: number | null | undefined
  }>,
  settings: StorefrontSettings,
  subtotalAmount: number,
  selectedShippingMethodId?: string | null,
  address?: Pick<StorefrontAddress, "country" | "state" | "pincode"> | null
) {
  const normalizeShippingText = (value: string | null | undefined) =>
    (value ?? "").trim().toLowerCase()
  const normalizePincode = (value: string | null | undefined) =>
    (value ?? "").replace(/\s+/g, "").trim().toLowerCase()
  const activeMethods = settings.shippingMethods.filter((method) => method.isActive)
  const shippingMethod =
    activeMethods.find((method) => method.id === selectedShippingMethodId) ??
    activeMethods.find((method) => method.isDefault) ??
    activeMethods[0] ??
    null
  const activeZones = settings.shippingZones.filter((zone) => zone.isActive)
  const shippingZone =
    address && activeZones.length > 0
      ? activeZones.find((zone) => {
          const matchesCountry =
            zone.countries.length === 0 ||
            zone.countries.some(
              (item) => normalizeShippingText(item) === normalizeShippingText(address.country)
            )
          const matchesState =
            zone.states.length === 0 ||
            zone.states.some(
              (item) => normalizeShippingText(item) === normalizeShippingText(address.state)
            )
          const matchesPincode =
            zone.pincodePrefixes.length === 0 ||
            zone.pincodePrefixes.some((item) =>
              normalizePincode(address.pincode).startsWith(normalizePincode(item))
            )

          return matchesCountry && matchesState && matchesPincode
        }) ??
        activeZones.find((zone) => zone.isDefault) ??
        activeZones[0] ??
        null
      : activeZones.find((zone) => zone.isDefault) ?? activeZones[0] ?? null
  const fallbackShippingApplies = items.some((item) => item.shippingCharge == null)
  const fallbackHandlingApplies = items.some((item) => item.handlingCharge == null)
  const explicitShippingAmount = items.reduce(
    (sum, item) => sum + (item.shippingCharge != null ? item.shippingCharge * item.quantity : 0),
    0
  )
  const explicitHandlingAmount = items.reduce(
    (sum, item) => sum + (item.handlingCharge != null ? item.handlingCharge * item.quantity : 0),
    0
  )
  const fallbackShippingAmount =
    (shippingMethod?.shippingAmount ?? settings.defaultShippingAmount) +
    (shippingZone?.shippingSurchargeAmount ?? 0)
  const fallbackHandlingAmount =
    (shippingMethod?.handlingAmount ?? settings.defaultHandlingAmount) +
    (shippingZone?.handlingSurchargeAmount ?? 0)
  const freeShippingThreshold =
    shippingZone?.freeShippingThresholdOverride ??
    shippingMethod?.freeShippingThreshold ??
    settings.freeShippingThreshold
  const globalShippingAmount =
    subtotalAmount >= freeShippingThreshold ? 0 : fallbackShippingAmount

  return {
    shippingMethod,
    shippingZone,
    codEligible: Boolean(shippingMethod?.codEligible && shippingZone?.codEligible),
    shippingAmount:
      explicitShippingAmount + (fallbackShippingApplies ? globalShippingAmount : 0),
    handlingAmount:
      explicitHandlingAmount +
      (fallbackHandlingApplies && items.length > 0 ? fallbackHandlingAmount : 0),
  }
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

async function buildOrderTaxBreakdown(
  database: Kysely<unknown>,
  items: StorefrontOrder["items"],
  products: Product[],
  billingAddress: StorefrontAddress,
  sellerState: string
): Promise<StorefrontOrderTaxBreakdown> {
  const taxes = await listCommonModuleItems(database, "taxes")
  const taxById = new Map(taxes.items.map((item) => [item.id, item]))
  const normalizedSellerState = sellerState.trim().toLowerCase()
  const normalizedCustomerState = billingAddress.state.trim().toLowerCase()
  const regime =
    normalizedSellerState && normalizedSellerState === normalizedCustomerState
      ? "intra_state"
      : "inter_state"

  const lines = items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId) ?? null
    const taxRecord =
      (product?.taxId ? taxById.get(product.taxId) : null) ??
      (product?.taxId?.includes("gst-standard")
        ? taxes.items.find(
            (entry) =>
              String(entry.id ?? "").toLowerCase() === "tax:gst-12" ||
              String(entry.code ?? "").toUpperCase() === "GST12"
          ) ?? null
        : null) ??
      taxes.items.find((entry) => String(entry["tax_type"] ?? "").toLowerCase() === "gst") ??
      null
    const ratePercent =
      typeof taxRecord?.["rate_percent"] === "number" && Number.isFinite(taxRecord["rate_percent"])
        ? Number(taxRecord["rate_percent"])
        : 0
    const taxableAmount =
      ratePercent > 0 ? roundCurrency((item.lineTotal * 100) / (100 + ratePercent)) : item.lineTotal
    const taxAmount = roundCurrency(item.lineTotal - taxableAmount)
    const cgstAmount = regime === "intra_state" ? roundCurrency(taxAmount / 2) : 0
    const sgstAmount = regime === "intra_state" ? roundCurrency(taxAmount - cgstAmount) : 0
    const igstAmount = regime === "inter_state" ? taxAmount : 0

    return {
      itemId: item.id,
      itemName: item.name,
      productId: item.productId,
      hsnCodeId: product?.hsnCodeId ?? null,
      taxId: product?.taxId ?? null,
      taxCode:
        typeof taxRecord?.code === "string" && taxRecord.code.trim().length > 0
          ? taxRecord.code
          : null,
      taxLabel:
        typeof taxRecord?.name === "string" && taxRecord.name.trim().length > 0
          ? taxRecord.name
          : null,
      ratePercent,
      taxableAmount,
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      cessAmount: 0,
    }
  })

  const taxableAmount = roundCurrency(lines.reduce((sum, item) => sum + item.taxableAmount, 0))
  const taxAmount = roundCurrency(lines.reduce((sum, item) => sum + item.taxAmount, 0))
  const cgstAmount = roundCurrency(lines.reduce((sum, item) => sum + item.cgstAmount, 0))
  const sgstAmount = roundCurrency(lines.reduce((sum, item) => sum + item.sgstAmount, 0))
  const igstAmount = roundCurrency(lines.reduce((sum, item) => sum + item.igstAmount, 0))

  return {
    regime,
    pricesIncludeTax: true,
    sellerState,
    customerState: billingAddress.state,
    taxableAmount,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessAmount: 0,
    shippingTaxAmount: 0,
    handlingTaxAmount: 0,
    lines,
  }
}

export async function createCheckoutOrder(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown,
  token?: string | null
) {
  let orderCreationAttempted = false
  let reservedOrderStock:
    | {
        orderId: string
        releaseReason: string
        reservation: StorefrontStockReservation
        orderWritten: boolean
      }
    | null = null
  let reservedOrderCoupon:
    | {
        orderId: string
        account: CustomerAccount
        couponId: string
      }
    | null = null

  try {
    const parsed = storefrontCheckoutPayloadSchema.parse(payload)
    const customer = token
      ? await resolveAuthenticatedCustomerAccount(database, config, token)
      : null
    const settings = await getStorefrontSettings(database)
    const existingOrders = await expireStalePendingReservations(database, await readOrders(database))
    const catalog = await readCoreProducts(database)
    const now = new Date().toISOString()

    const chargeInputs: Array<{
      quantity: number
      shippingCharge: number | null
      handlingCharge: number | null
    }> = []

    const items = parsed.items.map((input) => {
      const product = catalog.find((item) => item.id === input.productId && item.isActive)

      if (!product) {
        throw new ApplicationError(
          "A checkout item could not be found in the storefront catalog.",
          input,
          404
        )
      }

      const pricing = resolveProductPricing(product)

      if (input.quantity > pricing.availableQuantity) {
        throw new ApplicationError(
          "Requested quantity is not available for checkout.",
          {
            productId: product.id,
            requestedQuantity: input.quantity,
            availableQuantity: pricing.availableQuantity,
          },
          409
        )
      }

      chargeInputs.push({
        quantity: input.quantity,
        shippingCharge: product.storefront?.shippingCharge ?? null,
        handlingCharge: product.storefront?.handlingCharge ?? null,
      })

      return {
        id: `order-item:${randomUUID()}`,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brandName: product.brandName,
        imageUrl: resolveOrderItemImage(product),
        variantLabel: resolveOrderItemVariantLabel(product),
        attributes: resolveOrderItemAttributes(product),
        quantity: input.quantity,
        unitPrice: pricing.unitPrice,
        mrp: pricing.mrp,
        lineTotal: pricing.unitPrice * input.quantity,
      }
    })

    const subtotalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const discountAmount = items.reduce(
      (sum, item) => sum + Math.max(0, (item.mrp - item.unitPrice) * item.quantity),
      0
    )
    const { shippingAmount, handlingAmount, shippingMethod, shippingZone } =
      parsed.fulfillmentMethod === "store_pickup"
        ? {
            shippingAmount: 0,
            handlingAmount: 0,
            shippingMethod: null,
            shippingZone: null,
          }
        : calculateChargeTotals(
            chargeInputs,
            settings,
            subtotalAmount,
            parsed.shippingMethodId,
            parsed.shippingAddress
          )
    const totalAmount = subtotalAmount + shippingAmount + handlingAmount
    const taxBreakdown = await buildOrderTaxBreakdown(
      database,
      items,
      catalog,
      parsed.billingAddress,
      settings.pickupLocation.state || "Tamil Nadu"
    )
    const pickupLocation =
      parsed.fulfillmentMethod === "store_pickup" && settings.pickupLocation.enabled
        ? {
            storeName: settings.pickupLocation.storeName,
            line1: settings.pickupLocation.line1,
            line2: settings.pickupLocation.line2,
            city: settings.pickupLocation.city,
            state: settings.pickupLocation.state,
            country: settings.pickupLocation.country,
            pincode: settings.pickupLocation.pincode,
            contactPhone: settings.pickupLocation.contactPhone,
            contactEmail: settings.pickupLocation.contactEmail,
            pickupNote: settings.pickupLocation.pickupNote,
          }
        : null

    if (parsed.fulfillmentMethod === "store_pickup" && !pickupLocation) {
      throw new ApplicationError("Store pickup is not configured for this storefront.", {}, 409)
    }

    const coreContactId = await resolveCheckoutContactId(
      database,
      customer,
      parsed.shippingAddress
    )
    const checkoutFingerprint = buildCheckoutFingerprint({
      coreContactId,
      fulfillmentMethod: parsed.fulfillmentMethod,
      paymentCollectionMethod: parsed.paymentMethod,
      shippingAddress: parsed.shippingAddress,
      billingAddress: parsed.billingAddress,
      items,
      notes:
        [normalizeOptionalString(parsed.couponCode), normalizeOptionalString(parsed.notes)]
          .filter(Boolean)
          .join("|") || null,
    })
    const duplicatePendingOrder = existingOrders.find((item) => {
      if (
        item.checkoutFingerprint !== checkoutFingerprint ||
        item.paymentStatus !== "pending" ||
        item.status !== "payment_pending"
      ) {
        return false
      }

      const ageMs = Date.now() - new Date(item.createdAt).getTime()
      return Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= pendingReservationWindowMs
    })

    if (duplicatePendingOrder) {
      await recordCommerceMonitoringEvent(database, {
        operation: "checkout",
        status: "success",
        message: `Checkout reopened existing pending order ${duplicatePendingOrder.orderNumber}.`,
        referenceId: duplicatePendingOrder.id,
        context: {
          reusedPendingOrder: true,
          fulfillmentMethod: parsed.fulfillmentMethod,
          paymentMethod: parsed.paymentMethod,
        },
      })

      return storefrontCheckoutResponseSchema.parse({
        order: duplicatePendingOrder,
        payment: buildPaymentSessionFromExistingOrder(config, settings, duplicatePendingOrder),
      })
    }

    orderCreationAttempted = true
    const orderId = `storefront-order:${randomUUID()}`
    let appliedCoupon: StorefrontAppliedCoupon | null = null

    if (parsed.couponCode) {
      if (!customer) {
        throw new ApplicationError(
          "Coupon codes require a signed-in customer account.",
          { couponCode: parsed.couponCode },
          401
        )
      }

      const reservedCoupon = await reserveCustomerPortalCoupon(database, customer, {
        couponCode: parsed.couponCode,
        subtotalAmount,
        shippingAmount,
        orderId,
      })

      appliedCoupon = {
        couponId: reservedCoupon.coupon.id,
        code: reservedCoupon.coupon.code,
        title: reservedCoupon.coupon.title,
        discountType: reservedCoupon.coupon.discountType,
        discountLabel: reservedCoupon.coupon.discountLabel,
        discountAmount: reservedCoupon.discountAmount,
        reservedAt: new Date().toISOString(),
        releasedAt: null,
        releaseReason: null,
        usedAt: null,
        status: "reserved",
      }
      reservedOrderCoupon = {
        orderId,
        account: customer,
        couponId: reservedCoupon.coupon.id,
      }
    }

    const createdOrder = storefrontOrderSchema.parse({
      id: orderId,
      orderNumber: nextOrderNumber(existingOrders),
      customerAccountId: customer?.id ?? null,
      coreContactId,
      status: "created",
      paymentStatus: "pending",
      paymentProvider: parsed.paymentMethod === "online" ? "razorpay" : "store",
      paymentMode:
        parsed.paymentMethod === "online"
          ? config.commerce?.razorpay?.enabled
            ? "live"
            : "mock"
          : "offline",
      fulfillmentMethod: parsed.fulfillmentMethod,
      paymentCollectionMethod: parsed.paymentMethod,
      pickupLocation,
      shippingMethod,
      shippingZone,
      shipmentDetails: null,
      refund: null,
      stockReservation: null,
      appliedCoupon,
      taxBreakdown,
      providerOrderId: null,
      providerPaymentId: null,
      checkoutFingerprint,
      shippingAddress: parsed.shippingAddress,
      billingAddress: parsed.billingAddress,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalAmount,
      discountAmount: discountAmount + (appliedCoupon?.discountAmount ?? 0),
      shippingAmount,
      handlingAmount,
      totalAmount: Math.max(0, totalAmount - (appliedCoupon?.discountAmount ?? 0)),
      currency: "INR",
      notes: normalizeOptionalString(parsed.notes),
      timeline: [
        createTimelineEvent(
          "order_created",
          "Order created",
          parsed.fulfillmentMethod === "store_pickup"
            ? "Checkout order was created and the pickup reservation is being prepared."
            : "Checkout order was created and is awaiting payment."
        ),
      ],
      createdAt: now,
      updatedAt: now,
    })
    const order = transitionOrderStatus(createdOrder, "payment_pending")
    const reservationResult = applyReservationToProducts(catalog, order.items, now)

    if (!reservationResult.reservation) {
      throw new ApplicationError("Stock reservation could not be created for checkout.", {}, 409)
    }

    await writeCoreProducts(database, reservationResult.products)
    reservedOrderStock = {
      orderId,
      releaseReason: "checkout_setup_failed",
      reservation: reservationResult.reservation,
      orderWritten: false,
    }

    let payment: StorefrontPaymentSession
    let nextOrder: StorefrontOrder

    if (parsed.paymentMethod === "pay_at_store") {
      payment = {
        provider: "offline",
        mode: "offline",
        keyId: null,
        providerOrderId: null,
        amount: order.totalAmount,
        currency: order.currency,
        receipt: order.orderNumber,
        businessName: settings.pickupLocation.storeName,
        checkoutImage: null,
        themeColor: null,
      }
      nextOrder = storefrontOrderSchema.parse({
        ...order,
        stockReservation: reservationResult.reservation,
        timeline: [
          ...order.timeline,
          createTimelineEvent(
            "stock_reserved",
            "Stock reserved",
            "Sellable stock was reserved for this pickup order while payment remains pending."
          ),
          createTimelineEvent(
            "payment_pending",
            "Payment pending",
            "Payment will be collected when the customer arrives at the pickup location."
          ),
          createTimelineEvent(
            "pickup_reserved",
            "Pickup reserved",
            "Order is reserved for store pickup. Payment will be collected at the retail store."
          ),
        ],
        updatedAt: new Date().toISOString(),
      })
    } else {
      payment = await createRazorpayPaymentSession(config, order)
      nextOrder = storefrontOrderSchema.parse({
        ...order,
        paymentMode: payment.mode,
        stockReservation: reservationResult.reservation,
        providerOrderId: payment.providerOrderId,
        timeline: [
          ...order.timeline,
          createTimelineEvent(
            "stock_reserved",
            "Stock reserved",
            "Sellable stock was reserved for this order while the payment session remains active."
          ),
          createTimelineEvent(
            "payment_pending",
            "Payment pending",
            "The payment session is open and the order is waiting for payment completion."
          ),
        ],
        updatedAt: new Date().toISOString(),
      })
    }

    await writeOrders(database, [nextOrder, ...existingOrders])
    reservedOrderStock.orderWritten = true
    await recordCommerceMonitoringEvent(database, {
      operation: "order_creation",
      status: "success",
      message: `Order ${nextOrder.orderNumber} was created successfully.`,
      referenceId: nextOrder.id,
      context: {
        fulfillmentMethod: parsed.fulfillmentMethod,
        paymentMethod: parsed.paymentMethod,
        totalAmount: nextOrder.totalAmount,
      },
    })
    await recordCommerceMonitoringEvent(database, {
      operation: "checkout",
      status: "success",
      message: `Checkout created order ${nextOrder.orderNumber}.`,
      referenceId: nextOrder.id,
      context: {
        fulfillmentMethod: parsed.fulfillmentMethod,
        paymentMethod: parsed.paymentMethod,
        totalAmount: nextOrder.totalAmount,
      },
    })

    return storefrontCheckoutResponseSchema.parse({
      order: nextOrder,
      payment,
    })
  } catch (error) {
    if (reservedOrderStock) {
      const reservationRollback = reservedOrderStock

      if (reservationRollback.orderWritten) {
        const storedOrders = await readOrders(database)
        const reservedOrder = storedOrders.find((item) => item.id === reservationRollback.orderId)

        if (reservedOrder) {
          const releasedReservationOrder = await releaseOrderReservation(
            database,
            reservedOrder,
            reservationRollback.releaseReason
          )
          const releasedOrder = await releaseOrderCoupon(
            database,
            releasedReservationOrder,
            reservedOrderCoupon?.account ?? null,
            reservationRollback.releaseReason
          )

          await writeOrders(
            database,
            storedOrders.map((item) => (item.id === releasedOrder.id ? releasedOrder : item))
          )
        }
      } else {
        const products = await readCoreProducts(database)
        const nextProducts = releaseReservationFromProducts(
          products,
          reservationRollback.reservation,
          new Date().toISOString()
        )
        await writeCoreProducts(database, nextProducts)
      }
    }
    if (reservedOrderCoupon) {
      await releaseCustomerPortalCoupon(
        database,
        reservedOrderCoupon.account,
        reservedOrderCoupon.couponId,
        reservedOrderCoupon.orderId
      )
    }
    if (orderCreationAttempted) {
      await recordCommerceMonitoringEvent(database, {
        operation: "order_creation",
        status: "failure",
        message: "Order creation failed during checkout.",
        context: buildMonitoringErrorContext(error),
      })
    }
    await recordCommerceMonitoringEvent(database, {
      operation: "checkout",
      status: "failure",
      message: "Checkout failed before completion.",
      context: buildMonitoringErrorContext(error),
    })
    throw error
  }
}

export async function verifyCheckoutPayment(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown,
  token?: string | null
) {
  try {
    const parsed = storefrontPaymentVerificationPayloadSchema.parse(payload)
    const orders = await readOrders(database)
    const order = orders.find((item) => item.id === parsed.orderId)

    if (!order) {
      throw new ApplicationError(
        "Storefront order could not be found.",
        { orderId: parsed.orderId },
        404
      )
    }

    if (order.providerOrderId !== parsed.providerOrderId) {
      throw new ApplicationError("Payment order mismatch.", {}, 409)
    }

    if (order.providerPaymentId && order.paymentStatus === "paid") {
      if (
        order.providerPaymentId === parsed.providerPaymentId ||
        (order.paymentMode === "mock" && parsed.signature === "mock_signature")
      ) {
        await recordCommerceMonitoringEvent(database, {
          operation: "payment_verify",
          status: "success",
          message: `Payment verification reused existing success for order ${order.orderNumber}.`,
          referenceId: order.id,
          context: {
            reusedVerification: true,
            providerPaymentId: order.providerPaymentId,
          },
        })

        return storefrontOrderResponseSchema.parse({
          item: order,
        })
      }

      throw new ApplicationError(
        "Payment has already been verified for this order.",
        {
          orderId: order.id,
          existingProviderPaymentId: order.providerPaymentId,
          nextProviderPaymentId: parsed.providerPaymentId,
        },
        409
      )
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      throw new ApplicationError(
        "Payment cannot be verified for a cancelled or refunded order.",
        {
          orderId: order.id,
          status: order.status,
        },
        409
      )
    }

    if (order.stockReservation?.status === "released" && order.paymentStatus !== "paid") {
      throw new ApplicationError(
        "Payment cannot be verified after the stock reservation was released.",
        {
          orderId: order.id,
          releaseReason: order.stockReservation.releaseReason,
        },
        409
      )
    }

    if (
      !verifyRazorpaySignature(config, {
        providerOrderId: parsed.providerOrderId,
        providerPaymentId: parsed.providerPaymentId,
        signature: parsed.signature,
      })
    ) {
      throw new ApplicationError("Payment signature could not be verified.", {}, 400)
    }

    const verifiedCustomer =
      token && !order.customerAccountId
        ? await resolveAuthenticatedCustomerAccount(database, config, token)
        : null
    const couponAccount =
      verifiedCustomer ??
      (order.customerAccountId
        ? (await readCustomerAccounts(database)).find((item) => item.id === order.customerAccountId) ?? null
        : null)

    const paidOrder = transitionOrderStatus(order, "paid")
    const couponUsedOrder = await consumeOrderCoupon(
      database,
      storefrontOrderSchema.parse({
        ...order,
        ...paidOrder,
        customerAccountId: order.customerAccountId ?? verifiedCustomer?.id ?? null,
        coreContactId: verifiedCustomer?.coreContactId ?? order.coreContactId,
        paymentStatus: "paid",
        refund: order.refund,
        providerPaymentId: parsed.providerPaymentId,
        timeline: [
          ...order.timeline,
          createTimelineEvent(
            "payment_captured",
            "Payment captured",
            "Razorpay payment was verified successfully."
          ),
          createTimelineEvent(
            "order_paid",
            "Order paid",
            "The order is paid and waiting to enter fulfillment operations."
          ),
        ],
        updatedAt: new Date().toISOString(),
      }),
      couponAccount
    )
    const updatedOrder = storefrontOrderSchema.parse({
      ...couponUsedOrder,
    })

    await writeOrders(
      database,
      orders.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
    )
    await recordCommerceMonitoringEvent(database, {
      operation: "payment_verify",
      status: "success",
      message: `Payment was verified successfully for order ${updatedOrder.orderNumber}.`,
      referenceId: updatedOrder.id,
      context: {
        providerOrderId: updatedOrder.providerOrderId,
        providerPaymentId: updatedOrder.providerPaymentId,
      },
    })

    try {
      await sendStorefrontOrderConfirmedEmail({
        mailboxService: createMailboxService(database, config),
        config,
        settings: await getStorefrontSettings(database),
        order: updatedOrder,
        customerEmail: updatedOrder.shippingAddress.email,
        customerName: updatedOrder.shippingAddress.fullName,
      })
    } catch (error) {
      console.error("Unable to send storefront order confirmation email.", error)
    }

    return storefrontOrderResponseSchema.parse({
      item: updatedOrder,
    })
  } catch (error) {
    await recordCommerceMonitoringEvent(database, {
      operation: "payment_verify",
      status: "failure",
      message: "Payment verification failed.",
      context: buildMonitoringErrorContext(error),
    })
    throw error
  }
}

export async function requestStorefrontRefund(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsed = storefrontRefundRequestPayloadSchema.parse(payload)
  const orders = await readOrders(database)
  const order = orders.find((item) => item.id === parsed.orderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId: parsed.orderId }, 404)
  }

  if (order.paymentStatus !== "paid") {
    throw new ApplicationError(
      "Refund can only be initiated for a paid order.",
      {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
      },
      409
    )
  }

  if (order.status === "cancelled" || order.status === "refunded") {
    throw new ApplicationError(
      "Refund cannot be initiated for a cancelled or already refunded order.",
      {
        orderId: order.id,
        status: order.status,
      },
      409
    )
  }

  const requestedAmount = Math.round((parsed.amount ?? order.totalAmount) * 100) / 100

  if (requestedAmount <= 0 || requestedAmount > order.totalAmount) {
    throw new ApplicationError(
      "Refund amount must be greater than zero and cannot exceed the order total.",
      {
        orderId: order.id,
        requestedAmount,
        totalAmount: order.totalAmount,
      },
      400
    )
  }

  if (
    order.refund &&
    ["requested", "queued", "processing", "refunded"].includes(order.refund.status)
  ) {
    throw new ApplicationError(
      "Refund is already active for this order.",
      {
        orderId: order.id,
        refundStatus: order.refund.status,
      },
      409
    )
  }

  const now = new Date().toISOString()
  const isPartial = requestedAmount < order.totalAmount
  const updatedOrder = storefrontOrderSchema.parse({
    ...order,
    refund: buildRefundRecord(order, {
      type: isPartial ? "partial" : "full",
      status: "requested",
      requestedAmount,
      currency: order.currency,
      reason: normalizeOptionalString(parsed.reason),
      requestedBy: parsed.requestedBy,
      requestedAt: now,
      statusSummary: "Refund request recorded and awaiting operator or gateway action.",
      updatedAt: now,
    }),
    timeline: [
      ...order.timeline,
      createTimelineEvent(
        "refund_requested",
        "Refund requested",
        isPartial
          ? `A partial refund request for ${requestedAmount.toFixed(2)} ${order.currency} was recorded.`
          : "A full refund request was recorded for this order."
      ),
    ],
    updatedAt: now,
  })

  await writeOrders(
    database,
    orders.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
  )

  return storefrontOrderResponseSchema.parse({
    item: updatedOrder,
  })
}

export async function updateStorefrontRefundStatus(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsed = storefrontRefundStatusUpdatePayloadSchema.parse(payload ?? {})
  const orders = await readOrders(database)
  const order = orders.find((item) => item.id === parsed.orderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId: parsed.orderId }, 404)
  }

  if (!order.refund) {
    throw new ApplicationError("No refund request exists for this order.", { orderId: order.id }, 409)
  }

  if (order.refund.status === "refunded") {
    throw new ApplicationError("Completed refunds cannot be updated from admin operations.", { orderId: order.id }, 409)
  }

  const now = new Date().toISOString()
  const statusSummary =
    parsed.status === "queued"
      ? "Refund request is queued for settlement review."
      : parsed.status === "processing"
        ? "Refund is currently being processed."
        : normalizeOptionalString(parsed.reason) ?? "Refund request was rejected by admin operations."

  const updatedOrder = storefrontOrderSchema.parse({
    ...order,
    refund: buildRefundRecord(order, {
      ...order.refund,
      status: parsed.status,
      reason:
        parsed.status === "rejected"
          ? normalizeOptionalString(parsed.reason) ?? order.refund.reason
          : order.refund.reason,
      initiatedAt:
        parsed.status === "processing"
          ? order.refund.initiatedAt ?? now
          : order.refund.initiatedAt,
      failedAt: parsed.status === "rejected" ? now : order.refund.failedAt,
      statusSummary,
      updatedAt: now,
    }),
    timeline: [
      ...order.timeline,
      createTimelineEvent(
        `refund_${parsed.status}`,
        parsed.status === "queued"
          ? "Refund queued"
          : parsed.status === "processing"
            ? "Refund processing"
            : "Refund rejected",
        statusSummary
      ),
    ],
    updatedAt: now,
  })

  await writeOrders(
    database,
    orders.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
  )

  return storefrontOrderResponseSchema.parse({
    item: updatedOrder,
  })
}

function findOrderForRazorpayWebhook(
  orders: StorefrontOrder[],
  payload: RazorpayWebhookPayload
) {
  const storefrontOrderId =
    payload.payload?.payment?.entity?.notes?.storefrontOrderId ??
    payload.payload?.order?.entity?.notes?.storefrontOrderId ??
    payload.payload?.refund?.entity?.notes?.storefrontOrderId ??
    null

  if (storefrontOrderId) {
    const byId = orders.find((item) => item.id === storefrontOrderId)

    if (byId) {
      return byId
    }
  }

  const providerOrderId =
    payload.payload?.payment?.entity?.order_id ??
    payload.payload?.order?.entity?.id ??
    null

  if (providerOrderId) {
    const byProviderOrderId = orders.find((item) => item.providerOrderId === providerOrderId)

    if (byProviderOrderId) {
      return byProviderOrderId
    }
  }

  const providerPaymentId =
    payload.payload?.payment?.entity?.id ??
    payload.payload?.refund?.entity?.payment_id ??
    null

  if (providerPaymentId) {
    return orders.find((item) => item.providerPaymentId === providerPaymentId) ?? null
  }

  return null
}

function appendTimelineIfMissing(
  order: StorefrontOrder,
  input: { code: string; label: string; summary: string }
) {
  if (order.timeline.some((entry) => entry.code === input.code)) {
    return order.timeline
  }

  return [...order.timeline, createTimelineEvent(input.code, input.label, input.summary)]
}

function deriveWebhookEventId(input: {
  provider: "razorpay"
  providerEventId: string | null
  eventType: string
  payloadBody: string
}) {
  if (input.providerEventId?.trim()) {
    return `${input.provider}:${input.providerEventId.trim()}`
  }

  return `${input.provider}:${input.eventType}:${Buffer.from(input.payloadBody).toString("base64").slice(0, 48)}`
}

function createWebhookEventRecord(input: {
  provider: "razorpay"
  providerEventId: string | null
  eventType: string
  signature: string
  payloadBody: string
  orderId: string | null
  providerOrderId: string | null
  providerPaymentId: string | null
}): StorefrontPaymentWebhookEvent {
  const timestamp = new Date().toISOString()

  return storefrontPaymentWebhookEventSchema.parse({
    id: `storefront-payment-webhook:${randomUUID()}`,
    provider: input.provider,
    providerEventId: deriveWebhookEventId(input),
    eventType: input.eventType,
    signature: input.signature,
    orderId: input.orderId,
    providerOrderId: input.providerOrderId,
    providerPaymentId: input.providerPaymentId,
    processingStatus: "received",
    processingSummary: null,
    payloadBody: input.payloadBody,
    receivedAt: timestamp,
    processedAt: null,
    updatedAt: timestamp,
  })
}

export async function handleRazorpayWebhook(
  database: Kysely<unknown>,
  config: ServerConfig,
  input: {
    bodyText: string | null
    signature: string | null
    providerEventId?: string | null
  }
) {
  const payloadBody = input.bodyText?.trim() ?? ""

  try {
    const signature = input.signature?.trim() ?? ""

    if (!config.commerce?.razorpay?.enabled || !config.commerce.razorpay.webhookSecret) {
      throw new ApplicationError(
        "Razorpay webhook handling is not configured.",
        {},
        503
      )
    }

    if (!payloadBody) {
      throw new ApplicationError("Webhook body is required.", {}, 400)
    }

    if (!signature) {
      throw new ApplicationError("Razorpay webhook signature is required.", {}, 400)
    }

    if (
      !verifyRazorpayWebhookSignature(config, {
        payloadBody,
        signature,
      })
    ) {
      throw new ApplicationError("Razorpay webhook signature could not be verified.", {}, 401)
    }

    let payload: RazorpayWebhookPayload

    try {
      payload = JSON.parse(payloadBody) as RazorpayWebhookPayload
    } catch (error) {
      throw new ApplicationError(
        "Webhook payload is not valid JSON.",
        {
          detail: error instanceof Error ? error.message : "Unknown parse error",
        },
        400
      )
    }

    const event = payload.event?.trim() ?? "unknown"
    const orders = await readOrders(database)
    const storedEvents = await readStorefrontPaymentWebhookEvents(database)
    const eventRecordId = deriveWebhookEventId({
      provider: "razorpay",
      providerEventId: input.providerEventId ?? null,
      eventType: event,
      payloadBody,
    })
    const existingEvent = storedEvents.find((item) => item.providerEventId === eventRecordId)

    if (existingEvent && existingEvent.processingStatus !== "failed") {
      await recordCommerceMonitoringEvent(database, {
        operation: "webhook",
        status: "success",
        message: `Duplicate webhook ${event} was received and ignored safely.`,
        referenceId: existingEvent.orderId,
        context: {
          duplicate: true,
          event,
          providerEventId: eventRecordId,
        },
      })

      return {
        received: true,
        processed: false,
        duplicate: true,
        event,
        orderId: existingEvent.orderId,
        reason: `already_${existingEvent.processingStatus}`,
      }
    }

    const order = findOrderForRazorpayWebhook(orders, payload)
    const providerOrderId =
      payload.payload?.payment?.entity?.order_id ??
      payload.payload?.order?.entity?.id ??
      null
    const providerPaymentId =
      payload.payload?.payment?.entity?.id ??
      payload.payload?.refund?.entity?.payment_id ??
      null
    const baseEventRecord = createWebhookEventRecord({
      provider: "razorpay",
      providerEventId: input.providerEventId ?? null,
      eventType: event,
      signature,
      payloadBody,
      orderId: order?.id ?? null,
      providerOrderId,
      providerPaymentId,
    })

    if (!order) {
      await writeStorefrontPaymentWebhookEvents(database, [
        storefrontPaymentWebhookEventSchema.parse({
          ...baseEventRecord,
          processingStatus: "ignored",
          processingSummary: "No matching storefront order was found for this webhook event.",
          processedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        ...storedEvents.filter((item) => item.providerEventId !== baseEventRecord.providerEventId),
      ])
      await recordCommerceMonitoringEvent(database, {
        operation: "webhook",
        status: "success",
        message: `Webhook ${event} was accepted without a matching order.`,
        context: {
          event,
          reason: "matching_order_not_found",
          providerEventId: eventRecordId,
        },
      })

      return {
        received: true,
        processed: false,
        duplicate: false,
        event,
        orderId: null,
        reason: "matching_order_not_found",
      }
    }

    let nextOrder = order
    const couponAccount =
      order.customerAccountId
        ? (await readCustomerAccounts(database)).find((item) => item.id === order.customerAccountId) ?? null
        : null

    if (event === "payment.captured") {
      if (order.stockReservation?.status === "released" && order.paymentStatus !== "paid") {
        nextOrder = storefrontOrderSchema.parse({
          ...order,
          timeline: appendTimelineIfMissing(order, {
            code: "payment_capture_rejected",
            label: "Payment capture rejected",
            summary:
              "A late payment capture was ignored because the stock reservation had already been released.",
          }),
          updatedAt: new Date().toISOString(),
        })
      } else if (order.paymentStatus !== "paid") {
        const paidOrder = transitionOrderStatus(order, "paid")
        nextOrder = await consumeOrderCoupon(
          database,
          storefrontOrderSchema.parse({
            ...order,
            ...paidOrder,
            paymentStatus: "paid",
            providerPaymentId:
              payload.payload?.payment?.entity?.id ?? order.providerPaymentId,
            timeline: appendTimelineIfMissing(order, {
              code: "payment_captured",
              label: "Payment captured",
              summary: "Razorpay webhook confirmed that payment was captured.",
            }),
            updatedAt: new Date().toISOString(),
          }),
          couponAccount
        )
      }
    } else if (event === "payment.failed") {
      const failedOrder = storefrontOrderSchema.parse({
        ...order,
        paymentStatus: "failed",
        refund: order.refund,
        providerPaymentId:
          payload.payload?.payment?.entity?.id ?? order.providerPaymentId,
        timeline: appendTimelineIfMissing(order, {
          code: "payment_failed",
          label: "Payment failed",
          summary:
            payload.payload?.payment?.entity?.error_description?.trim() ||
            "Razorpay webhook reported a failed payment attempt.",
        }),
        updatedAt: new Date().toISOString(),
      })
      nextOrder = await releaseOrderReservation(database, failedOrder, "payment_failed")
      nextOrder = await releaseOrderCoupon(database, nextOrder, couponAccount, "payment_failed")
    } else if (event === "refund.processed" || event === "payment.refunded") {
      if (order.status !== "refunded" || order.paymentStatus !== "refunded") {
        const now = new Date().toISOString()
        const refundedOrder = transitionOrderStatus(order, "refunded")
        nextOrder = storefrontOrderSchema.parse({
          ...order,
          ...refundedOrder,
          paymentStatus: "refunded",
          refund: buildRefundRecord(order, {
            type: order.refund?.type ?? "full",
            status: "refunded",
            requestedAmount: order.refund?.requestedAmount ?? order.totalAmount,
            currency: order.currency,
            reason: order.refund?.reason ?? null,
            requestedBy: order.refund?.requestedBy ?? "system",
            requestedAt: order.refund?.requestedAt ?? now,
            initiatedAt: order.refund?.initiatedAt ?? now,
            completedAt: now,
            providerRefundId:
              payload.payload?.refund?.entity?.id ?? order.refund?.providerRefundId ?? null,
            statusSummary: "Razorpay webhook confirmed that the refund was completed.",
            updatedAt: now,
          }),
          timeline: appendTimelineIfMissing(order, {
            code: "payment_refunded",
            label: "Payment refunded",
            summary: "Razorpay webhook confirmed that the payment was refunded.",
          }),
          updatedAt: now,
        })
      }
    }

    if (nextOrder !== order) {
      await writeOrders(
        database,
        orders.map((item) => (item.id === nextOrder.id ? nextOrder : item))
      )

      if (event === "payment.failed") {
        try {
          await sendStorefrontPaymentFailedEmail({
            mailboxService: createMailboxService(database, config),
            config,
            settings: await getStorefrontSettings(database),
            order: nextOrder,
            customerEmail: nextOrder.shippingAddress.email,
            customerName: nextOrder.shippingAddress.fullName,
            failureReason:
              payload.payload?.payment?.entity?.error_description?.trim() ??
              "The last payment attempt failed. You can retry payment using the same order.",
          })
        } catch (error) {
          console.error("Unable to send storefront payment failed email.", error)
        }
      }
    }

    await writeStorefrontPaymentWebhookEvents(database, [
      storefrontPaymentWebhookEventSchema.parse({
        ...(existingEvent ?? baseEventRecord),
        orderId: order.id,
        providerOrderId,
        providerPaymentId,
        processingStatus: nextOrder === order ? "ignored" : "processed",
        processingSummary:
          nextOrder === order
            ? "Webhook was valid but did not require any additional state transition."
            : "Webhook was processed and the matching storefront order state was updated.",
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      ...storedEvents.filter((item) => item.providerEventId !== eventRecordId),
    ])
    await recordCommerceMonitoringEvent(database, {
      operation: "webhook",
      status: "success",
      message: `Webhook ${event} was handled successfully.`,
      referenceId: order.id,
      context: {
        duplicate: false,
        processed: nextOrder !== order,
        providerEventId: eventRecordId,
      },
    })

    return {
      received: true,
      processed: nextOrder !== order,
      duplicate: false,
      event,
      orderId: order.id,
      reason: nextOrder === order ? "no_state_change" : null,
    }
  } catch (error) {
    await recordCommerceMonitoringEvent(database, {
      operation: "webhook",
      status: "failure",
      message: "Webhook processing failed.",
      context: {
        payloadPresent: payloadBody.length > 0,
        ...buildMonitoringErrorContext(error),
      },
    })
    throw error
  }
}

function buildReconciliationItem(
  order: StorefrontOrder,
  nextOrder: StorefrontOrder,
  action: StorefrontPaymentReconciliationItem["action"],
  summary: string
): StorefrontPaymentReconciliationItem {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    providerOrderId: order.providerOrderId,
    action,
    paymentStatusBefore: order.paymentStatus,
    paymentStatusAfter: nextOrder.paymentStatus,
    orderStatusBefore: order.status,
    orderStatusAfter: nextOrder.status,
    summary,
  }
}

function getOrderAgeHours(order: StorefrontOrder) {
  const ageMs = Date.now() - new Date(order.createdAt).getTime()

  if (!Number.isFinite(ageMs) || ageMs <= 0) {
    return 0
  }

  return Math.round((ageMs / (60 * 60 * 1000)) * 10) / 10
}

function getTimelineTimestamp(order: StorefrontOrder, code: string) {
  return order.timeline.find((entry) => entry.code === code)?.createdAt ?? null
}

function getAgeHoursFromTimestamp(value: string) {
  const ageMs = Date.now() - new Date(value).getTime()

  if (!Number.isFinite(ageMs) || ageMs <= 0) {
    return 0
  }

  return Math.round((ageMs / (60 * 60 * 1000)) * 10) / 10
}

function getAccountingCompatibilitySeverity(
  status: StorefrontAccountingCompatibilityItem["status"]
) {
  switch (status) {
    case "blocked":
      return 2
    case "manual_review":
      return 1
    default:
      return 0
  }
}

function buildAccountingCompatibilityItem(
  order: StorefrontOrder
): StorefrontAccountingCompatibilityItem {
  const issueCodes: StorefrontAccountingCompatibilityItem["issueCodes"] = []
  const taxBreakdown = order.taxBreakdown

  if (!["paid", "refunded"].includes(order.paymentStatus)) {
    issueCodes.push("lifecycle_not_invoice_ready")
  }

  if (!taxBreakdown) {
    issueCodes.push("missing_tax_breakdown")
  }

  if (
    !order.billingAddress.state.trim() ||
    !taxBreakdown?.sellerState.trim() ||
    !taxBreakdown?.customerState.trim()
  ) {
    issueCodes.push("missing_place_of_supply")
  }

  if (taxBreakdown?.lines.some((line) => !line.taxId)) {
    issueCodes.push("missing_product_tax_mapping")
  }

  const distinctRates = taxBreakdown
    ? [...new Set(taxBreakdown.lines.map((line) => roundCurrency(line.ratePercent)))]
    : []

  if (distinctRates.length > 1) {
    issueCodes.push("multi_rate_tax_not_supported")
  }

  if (order.shippingAmount > 0 && (taxBreakdown?.shippingTaxAmount ?? 0) === 0) {
    issueCodes.push("shipping_tax_treatment_pending")
  }

  if (order.handlingAmount > 0 && (taxBreakdown?.handlingTaxAmount ?? 0) === 0) {
    issueCodes.push("handling_tax_treatment_pending")
  }

  if (order.paymentStatus === "refunded" || order.status === "refunded") {
    issueCodes.push("refund_requires_credit_note")
  }

  let status: StorefrontAccountingCompatibilityItem["status"] = "ready"

  if (
    issueCodes.includes("lifecycle_not_invoice_ready") ||
    issueCodes.includes("missing_tax_breakdown") ||
    issueCodes.includes("missing_place_of_supply")
  ) {
    status = "blocked"
  } else if (issueCodes.length > 0) {
    status = "manual_review"
  }

  const issueMessages: Record<StorefrontAccountingCompatibilityItem["issueCodes"][number], string> = {
    lifecycle_not_invoice_ready: "Order is not yet in a paid billing lifecycle.",
    missing_tax_breakdown: "Stored GST snapshot is missing.",
    missing_place_of_supply: "Place-of-supply state information is incomplete.",
    missing_product_tax_mapping: "One or more order lines do not carry a product tax mapping.",
    multi_rate_tax_not_supported:
      "Current billing sales invoice posting supports one GST rate per voucher, but this order has mixed rates.",
    shipping_tax_treatment_pending:
      "Shipping charge tax treatment is not modeled in the current storefront-to-billing bridge.",
    handling_tax_treatment_pending:
      "Handling charge tax treatment is not modeled in the current storefront-to-billing bridge.",
    refund_requires_credit_note:
      "Refunded orders require billing-side credit-note treatment rather than only the storefront refund snapshot.",
  }

  const issueSummary =
    issueCodes.length > 0
      ? issueCodes.map((code) => issueMessages[code]).join(" ")
      : "Order tax snapshot is compatible with the current billing invoice workflow."

  const recommendedAction =
    status === "ready"
      ? "Create the billing sales invoice from the stored GST snapshot and keep the storefront receipt as supporting evidence."
      : issueCodes.includes("multi_rate_tax_not_supported")
        ? "Review this order manually in billing because the current posted sales invoice workflow supports only one GST rate per voucher."
        : issueCodes.includes("refund_requires_credit_note")
          ? "Use billing credit-note workflow for the refund and reconcile it against the original order tax snapshot."
          : issueCodes.includes("lifecycle_not_invoice_ready")
            ? "Wait for verified paid or refunded state before creating accounting documents."
            : "Review the order tax and place-of-supply data manually before billing entry."

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    customerName: order.shippingAddress.fullName,
    customerEmail: order.shippingAddress.email,
    totalAmount: order.totalAmount,
    currency: order.currency,
    status,
    issueCodes,
    issueSummary,
    recommendedAction,
    suggestedSupplyType:
      taxBreakdown?.regime === "intra_state"
        ? "intra"
        : taxBreakdown?.regime === "inter_state"
          ? "inter"
          : null,
    suggestedTaxRate: distinctRates.length === 1 ? distinctRates[0] ?? null : null,
    taxableAmount: taxBreakdown?.taxableAmount ?? 0,
    taxAmount: taxBreakdown?.taxAmount ?? 0,
    updatedAt: order.updatedAt,
  }
}

function resolveFulfilmentAgingStartedAt(order: StorefrontOrder) {
  return (
    getTimelineTimestamp(order, "fulfilment_ready") ??
    getTimelineTimestamp(order, "order_paid") ??
    getTimelineTimestamp(order, "payment_captured") ??
    order.updatedAt
  )
}

function buildOperationalAgingBuckets<
  TItem extends { ageHours: number; totalAmount?: number; requestedAmount?: number }
>(items: TItem[]) {
  const seed: StorefrontOperationalAgingBucket[] = [
    { key: "under_24h", label: "Under 24h", count: 0, amount: 0 },
    { key: "between_24h_48h", label: "24h to 48h", count: 0, amount: 0 },
    { key: "between_48h_72h", label: "48h to 72h", count: 0, amount: 0 },
    { key: "over_72h", label: "Over 72h", count: 0, amount: 0 },
  ]

  for (const item of items) {
    const amount = item.totalAmount ?? item.requestedAmount ?? 0
    const target =
      item.ageHours >= 72
        ? seed[3]
        : item.ageHours >= 48
          ? seed[2]
          : item.ageHours >= 24
            ? seed[1]
            : seed[0]

    if (!target) {
      continue
    }

    target.count += 1
    target.amount += amount
  }

  return seed
}

function buildSettlementQueueItem(order: StorefrontOrder): StorefrontPaymentSettlementItem {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    customerName: order.shippingAddress.fullName,
    customerEmail: order.shippingAddress.email,
    totalAmount: order.totalAmount,
    currency: order.currency,
    providerOrderId: order.providerOrderId,
    providerPaymentId: order.providerPaymentId,
    paidAt: getTimelineTimestamp(order, "payment_captured") ?? getTimelineTimestamp(order, "order_paid"),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    ageHours: getOrderAgeHours(order),
  }
}

function buildShipmentDetails(
  order: StorefrontOrder,
  overrides: Partial<StorefrontShipmentDetails> = {}
): StorefrontShipmentDetails {
  const timestamp = new Date().toISOString()

  return {
    carrierName: overrides.carrierName ?? order.shipmentDetails?.carrierName ?? null,
    trackingId: overrides.trackingId ?? order.shipmentDetails?.trackingId ?? null,
    trackingUrl: overrides.trackingUrl ?? order.shipmentDetails?.trackingUrl ?? null,
    note: overrides.note ?? order.shipmentDetails?.note ?? null,
    markedFulfilmentAt:
      overrides.markedFulfilmentAt ?? order.shipmentDetails?.markedFulfilmentAt ?? null,
    shippedAt: overrides.shippedAt ?? order.shipmentDetails?.shippedAt ?? null,
    deliveredAt: overrides.deliveredAt ?? order.shipmentDetails?.deliveredAt ?? null,
    updatedAt: overrides.updatedAt ?? timestamp,
  }
}

function buildFailedPaymentExceptionItem(
  order: StorefrontOrder,
  summary: string
): StorefrontPaymentExceptionItem {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    customerName: order.shippingAddress.fullName,
    customerEmail: order.shippingAddress.email,
    totalAmount: order.totalAmount,
    currency: order.currency,
    providerOrderId: order.providerOrderId,
    providerPaymentId: order.providerPaymentId,
    summary,
    lastAttemptAt:
      getTimelineTimestamp(order, "payment_failed") ??
      getTimelineTimestamp(order, "payment_captured"),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

function buildWebhookExceptionItem(
  event: StorefrontPaymentWebhookEvent
): StorefrontPaymentWebhookExceptionItem {
  return {
    id: event.id,
    providerEventId: event.providerEventId,
    eventType: event.eventType,
    processingStatus: event.processingStatus,
    processingSummary: event.processingSummary,
    orderId: event.orderId,
    providerOrderId: event.providerOrderId,
    providerPaymentId: event.providerPaymentId,
    receivedAt: event.receivedAt,
    processedAt: event.processedAt,
  }
}

function buildRefundQueueItem(order: StorefrontOrder): StorefrontRefundQueueItem | null {
  if (!order.refund) {
    return null
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    refundStatus: order.refund.status,
    refundType: order.refund.type,
    requestedAmount: order.refund.requestedAmount,
    currency: order.refund.currency,
    customerName: order.shippingAddress.fullName,
    customerEmail: order.shippingAddress.email,
    providerPaymentId: order.providerPaymentId,
    providerRefundId: order.refund.providerRefundId,
    summary:
      order.refund.statusSummary ??
      (order.refund.status === "refunded"
        ? "Refund completed."
        : "Refund request is active and waiting on the next admin or gateway step."),
    requestedAt: order.refund.requestedAt,
    updatedAt: order.refund.updatedAt,
  }
}

function buildOrderQueueBucket(order: StorefrontOrder): StorefrontAdminOrderQueueBucket {
  if (order.status === "cancelled" || order.status === "refunded") {
    return "closed"
  }

  if (order.paymentStatus === "failed" || order.status === "created" || order.status === "payment_pending") {
    return "payment_attention"
  }

  if (
    order.fulfillmentMethod === "store_pickup" &&
    order.status !== "delivered"
  ) {
    return "pickup"
  }

  if (order.status === "shipped") {
    return "shipment"
  }

  if (order.status === "delivered") {
    return "completed"
  }

  return "fulfilment"
}

function buildOrderQueueItem(order: StorefrontOrder): StorefrontAdminOrderQueueItem {
  const latestTimelineEvent =
    [...order.timeline].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ??
    {
      label: "Order updated",
      summary: "Order activity is available in the ecommerce timeline.",
      createdAt: order.updatedAt,
    }
  const queueBucket = buildOrderQueueBucket(order)
  const firstItem = order.items[0]
  const extraItemCount = Math.max(0, order.items.length - 1)

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paymentMode: order.paymentMode,
    fulfillmentMethod: order.fulfillmentMethod,
    paymentCollectionMethod: order.paymentCollectionMethod,
    refundStatus: order.refund?.status ?? null,
    customerName: order.shippingAddress.fullName,
    customerEmail: order.shippingAddress.email,
    customerPhone: order.shippingAddress.phoneNumber,
    itemCount: order.itemCount,
    totalAmount: order.totalAmount,
    currency: order.currency,
    itemSummary: firstItem
      ? extraItemCount > 0
        ? `${firstItem.name} + ${extraItemCount} more`
        : firstItem.name
      : "Order items unavailable",
    latestTimelineLabel: latestTimelineEvent.label,
    latestTimelineSummary: latestTimelineEvent.summary,
    latestTimelineAt: latestTimelineEvent.createdAt,
    queueBucket,
    needsAttention: queueBucket === "payment_attention" || queueBucket === "pickup",
    ageHours: getOrderAgeHours(order),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

function formatBusinessDay(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10)
  }

  return date.toISOString().slice(0, 10)
}

function resolveDailyPaymentSummaryDay(order: StorefrontOrder) {
  if (order.refund?.completedAt) {
    return formatBusinessDay(order.refund.completedAt)
  }

  const paymentCapturedEvent = order.timeline.find((entry) => entry.code === "payment_captured")
  if (paymentCapturedEvent?.createdAt) {
    return formatBusinessDay(paymentCapturedEvent.createdAt)
  }

  const paymentFailedEvent = [...order.timeline]
    .reverse()
    .find((entry) => entry.code === "payment_failed")
  if (paymentFailedEvent?.createdAt) {
    return formatBusinessDay(paymentFailedEvent.createdAt)
  }

  return formatBusinessDay(order.createdAt)
}

function buildPaymentDailySummaryItems(
  orders: StorefrontOrder[],
  days: number
): StorefrontPaymentDailySummaryItem[] {
  const now = Date.now()
  const dayWindowMs = Math.max(1, days) * 24 * 60 * 60 * 1000
  const rows = new Map<string, StorefrontPaymentDailySummaryItem>()

  for (const order of orders) {
    if (order.paymentProvider !== "razorpay") {
      continue
    }

    const day = resolveDailyPaymentSummaryDay(order)
    const dayTimestamp = new Date(`${day}T00:00:00.000Z`).getTime()

    if (Number.isFinite(dayTimestamp) && now - dayTimestamp > dayWindowMs) {
      continue
    }

    const rowKey = `${day}:${order.currency}`
    const existing =
      rows.get(rowKey) ??
      storefrontPaymentDailySummaryReportSchema.shape.items.element.parse({
        day,
        currency: order.currency,
        orderCount: 0,
        paidCount: 0,
        failedCount: 0,
        pendingCount: 0,
        refundedCount: 0,
        grossAmount: 0,
        paidAmount: 0,
        failedAmount: 0,
        pendingAmount: 0,
        refundedAmount: 0,
      })

    existing.orderCount += 1
    existing.grossAmount += order.totalAmount

    if (order.paymentStatus === "paid") {
      existing.paidCount += 1
      existing.paidAmount += order.totalAmount
    } else if (order.paymentStatus === "failed") {
      existing.failedCount += 1
      existing.failedAmount += order.totalAmount
    } else if (order.paymentStatus === "pending") {
      existing.pendingCount += 1
      existing.pendingAmount += order.totalAmount
    } else if (order.paymentStatus === "refunded") {
      existing.refundedCount += 1
      existing.refundedAmount += order.totalAmount
    }

    rows.set(rowKey, existing)
  }

  return [...rows.values()].sort((left, right) => {
    const byDay = right.day.localeCompare(left.day)
    return byDay !== 0 ? byDay : left.currency.localeCompare(right.currency)
  })
}

function escapeCsvCell(value: string | number) {
  const stringValue = String(value)
  if (!/[",\n]/.test(stringValue)) {
    return stringValue
  }

  return `"${stringValue.replaceAll('"', '""')}"`
}

export async function getStorefrontPaymentOperationsReport(
  database: Kysely<unknown>
) {
  const [orders, webhookEvents] = await Promise.all([
    readOrders(database),
    readStorefrontPaymentWebhookEvents(database),
  ])

  const livePaymentOrders = orders.filter(
    (order) =>
      order.paymentProvider === "razorpay" &&
      order.paymentMode === "live"
  )

  const settlementQueue = livePaymentOrders
    .filter(
      (order) =>
        order.paymentStatus === "paid" &&
        order.status !== "cancelled" &&
        order.status !== "refunded"
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((order) => buildSettlementQueueItem(order))

  const failedPayments = livePaymentOrders
    .filter(
      (order) =>
        order.paymentStatus === "failed" ||
        (order.paymentStatus === "pending" && order.status === "payment_pending")
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((order) =>
      buildFailedPaymentExceptionItem(
        order,
        order.paymentStatus === "failed"
          ? "Payment attempt failed and needs customer recovery or admin follow-up."
          : "Payment is still pending and should be checked against Razorpay or customer retry flow."
      )
    )

  const webhookExceptions = webhookEvents
    .filter((event) => event.processingStatus === "ignored" || event.processingStatus === "failed")
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
    .map((event) => buildWebhookExceptionItem(event))

  const refundQueue = livePaymentOrders
    .map((order) => buildRefundQueueItem(order))
    .filter((item): item is StorefrontRefundQueueItem => item !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  return storefrontPaymentOperationsReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      livePaymentOrderCount: livePaymentOrders.length,
      settlementPendingCount: settlementQueue.length,
      settlementPendingAmount: settlementQueue.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      ),
      failedPaymentCount: failedPayments.filter((item) => item.paymentStatus === "failed").length,
      paymentPendingCount: failedPayments.filter((item) => item.paymentStatus === "pending").length,
      webhookExceptionCount: webhookExceptions.length,
      refundQueueCount: refundQueue.length,
      refundInFlightCount: refundQueue.filter((item) =>
        ["requested", "queued", "processing"].includes(item.refundStatus)
      ).length,
      refundedCount: refundQueue.filter((item) => item.refundStatus === "refunded").length,
    },
    settlementQueue,
    failedPayments,
    webhookExceptions,
    refundQueue,
  })
}

export async function getStorefrontOperationalAgingReport(
  database: Kysely<unknown>
) {
  const [paymentsReport, orders] = await Promise.all([
    getStorefrontPaymentOperationsReport(database),
    readOrders(database),
  ])

  const fulfilmentItems = orders
    .filter(
      (order) =>
        buildOrderQueueBucket(order) === "fulfilment" &&
        !["requested", "queued", "processing", "failed"].includes(order.refund?.status ?? "none")
    )
    .map((order) => {
      const queueItem = buildOrderQueueItem(order)
      const agingStartedAt = resolveFulfilmentAgingStartedAt(order)

      return {
        orderId: queueItem.orderId,
        orderNumber: queueItem.orderNumber,
        orderStatus: queueItem.orderStatus,
        customerName: queueItem.customerName,
        customerEmail: queueItem.customerEmail,
        itemSummary: queueItem.itemSummary,
        currency: queueItem.currency,
        totalAmount: queueItem.totalAmount,
        ageHours: getAgeHoursFromTimestamp(agingStartedAt),
        agingStartedAt,
        updatedAt: queueItem.updatedAt,
      } satisfies StorefrontFulfilmentAgingItem
    })
    .sort((left, right) => right.ageHours - left.ageHours)

  const refundItems = paymentsReport.refundQueue
    .filter((item) => ["requested", "queued", "processing", "failed"].includes(item.refundStatus))
    .map((item) => ({
      orderId: item.orderId,
      orderNumber: item.orderNumber,
      orderStatus: item.orderStatus,
      refundStatus: item.refundStatus,
      customerName: item.customerName,
      customerEmail: item.customerEmail,
      currency: item.currency,
      requestedAmount: item.requestedAmount,
      ageHours: getAgeHoursFromTimestamp(item.requestedAt ?? item.updatedAt),
      agingStartedAt: item.requestedAt ?? item.updatedAt,
      updatedAt: item.updatedAt,
      summary: item.summary,
    } satisfies StorefrontRefundAgingItem))
    .sort((left, right) => right.ageHours - left.ageHours)

  const report: StorefrontOperationalAgingReport = {
    generatedAt: new Date().toISOString(),
    summary: {
      fulfilmentAgingCount: fulfilmentItems.length,
      fulfilmentOver72HoursCount: fulfilmentItems.filter((item) => item.ageHours >= 72).length,
      refundAgingCount: refundItems.length,
      refundOver72HoursCount: refundItems.filter((item) => item.ageHours >= 72).length,
    },
    fulfilmentBuckets: buildOperationalAgingBuckets(fulfilmentItems),
    refundBuckets: buildOperationalAgingBuckets(refundItems),
    fulfilmentItems,
    refundItems,
  }

  return storefrontOperationalAgingReportSchema.parse(report)
}

export async function getStorefrontAccountingCompatibilityReport(
  database: Kysely<unknown>
) {
  const orders = await readOrders(database)
  const items = orders
    .map((order) => buildAccountingCompatibilityItem(order))
    .sort(
      (left, right) =>
        getAccountingCompatibilitySeverity(right.status) -
          getAccountingCompatibilitySeverity(left.status) ||
        right.updatedAt.localeCompare(left.updatedAt)
    )

  const report: StorefrontAccountingCompatibilityReport = {
    generatedAt: new Date().toISOString(),
    summary: {
      reviewedOrderCount: items.length,
      readyCount: items.filter((item) => item.status === "ready").length,
      manualReviewCount: items.filter((item) => item.status === "manual_review").length,
      blockedCount: items.filter((item) => item.status === "blocked").length,
      refundFollowUpCount: items.filter((item) =>
        item.issueCodes.includes("refund_requires_credit_note")
      ).length,
      multiRateCount: items.filter((item) =>
        item.issueCodes.includes("multi_rate_tax_not_supported")
      ).length,
    },
    items,
  }

  return storefrontAccountingCompatibilityReportSchema.parse(report)
}

export async function getStorefrontOverviewKpiReport(
  database: Kysely<unknown>
) {
  const [orders, agingReport] = await Promise.all([
    readOrders(database),
    getStorefrontOperationalAgingReport(database),
  ])

  const orderCount = orders.length
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid")
  const failedOrders = orders.filter((order) => order.paymentStatus === "failed")
  const pendingOrders = orders.filter((order) => order.paymentStatus === "pending")
  const averageOrderValue =
    paidOrders.length > 0
      ? paidOrders.reduce((sum, order) => sum + order.totalAmount, 0) / paidOrders.length
      : 0
  const conversionRate =
    orderCount > 0 ? Math.round((paidOrders.length / orderCount) * 1000) / 10 : 0
  const currency =
    paidOrders[0]?.currency ??
    orders[0]?.currency ??
    agingReport.fulfilmentItems[0]?.currency ??
    agingReport.refundItems[0]?.currency ??
    "INR"

  const report: StorefrontOverviewKpiReport = {
    generatedAt: new Date().toISOString(),
    currency,
    summary: {
      orderCount,
      paidOrderCount: paidOrders.length,
      failedOrderCount: failedOrders.length,
      pendingOrderCount: pendingOrders.length,
      conversionRate,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      fulfilmentAgingCount: agingReport.summary.fulfilmentAgingCount,
      refundAgingCount: agingReport.summary.refundAgingCount,
      fulfilmentOver72HoursCount: agingReport.summary.fulfilmentOver72HoursCount,
      refundOver72HoursCount: agingReport.summary.refundOver72HoursCount,
    },
  }

  return storefrontOverviewKpiReportSchema.parse(report)
}

export async function getStorefrontPaymentDailySummaryReport(
  database: Kysely<unknown>,
  input: { days?: number } = {}
) {
  const days = Math.max(1, Math.min(90, input.days ?? 30))
  const orders = await readOrders(database)
  const items = buildPaymentDailySummaryItems(orders, days)

  return storefrontPaymentDailySummaryReportSchema.parse({
    generatedAt: new Date().toISOString(),
    days,
    items,
  })
}

export async function getStorefrontPaymentDailySummaryDocument(
  database: Kysely<unknown>,
  input: { days?: number } = {}
) {
  const report = await getStorefrontPaymentDailySummaryReport(database, input)
  const lines = [
    [
      "day",
      "currency",
      "order_count",
      "paid_count",
      "failed_count",
      "pending_count",
      "refunded_count",
      "gross_amount",
      "paid_amount",
      "failed_amount",
      "pending_amount",
      "refunded_amount",
    ].join(","),
    ...report.items.map((item) =>
      [
        item.day,
        item.currency,
        item.orderCount,
        item.paidCount,
        item.failedCount,
        item.pendingCount,
        item.refundedCount,
        item.grossAmount.toFixed(2),
        item.paidAmount.toFixed(2),
        item.failedAmount.toFixed(2),
        item.pendingAmount.toFixed(2),
        item.refundedAmount.toFixed(2),
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ]

  return storefrontPaymentDailySummaryDocumentSchema.parse({
    fileName: `storefront-payment-daily-summary-${report.generatedAt.slice(0, 10)}.csv`,
    csv: lines.join("\n"),
  })
}

export async function getStorefrontFailedPaymentReportDocument(database: Kysely<unknown>) {
  const report = await getStorefrontPaymentOperationsReport(database)
  const lines = [
    [
      "order_number",
      "order_status",
      "payment_status",
      "customer_name",
      "customer_email",
      "currency",
      "total_amount",
      "provider_order_id",
      "provider_payment_id",
      "last_attempt_at",
      "created_at",
      "updated_at",
      "summary",
    ].join(","),
    ...report.failedPayments.map((item) =>
      [
        item.orderNumber,
        item.orderStatus,
        item.paymentStatus,
        item.customerName,
        item.customerEmail,
        item.currency,
        item.totalAmount.toFixed(2),
        item.providerOrderId ?? "",
        item.providerPaymentId ?? "",
        item.lastAttemptAt ?? "",
        item.createdAt,
        item.updatedAt,
        item.summary,
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ]

  return storefrontFailedPaymentReportDocumentSchema.parse({
    fileName: `storefront-failed-payments-${new Date().toISOString().slice(0, 10)}.csv`,
    csv: lines.join("\n"),
  })
}

export async function getStorefrontRefundReportDocument(database: Kysely<unknown>) {
  const report = await getStorefrontPaymentOperationsReport(database)
  const lines = [
    [
      "order_number",
      "order_status",
      "payment_status",
      "refund_status",
      "refund_type",
      "customer_name",
      "customer_email",
      "currency",
      "requested_amount",
      "provider_payment_id",
      "provider_refund_id",
      "requested_at",
      "updated_at",
      "summary",
    ].join(","),
    ...report.refundQueue.map((item) =>
      [
        item.orderNumber,
        item.orderStatus,
        item.paymentStatus,
        item.refundStatus,
        item.refundType,
        item.customerName,
        item.customerEmail,
        item.currency,
        item.requestedAmount.toFixed(2),
        item.providerPaymentId ?? "",
        item.providerRefundId ?? "",
        item.requestedAt ?? "",
        item.updatedAt,
        item.summary,
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ]

  return storefrontRefundReportDocumentSchema.parse({
    fileName: `storefront-refunds-${new Date().toISOString().slice(0, 10)}.csv`,
    csv: lines.join("\n"),
  })
}

export async function getStorefrontSettlementGapReportDocument(database: Kysely<unknown>) {
  const report = await getStorefrontPaymentOperationsReport(database)
  const lines = [
    [
      "order_number",
      "order_status",
      "payment_status",
      "customer_name",
      "customer_email",
      "currency",
      "total_amount",
      "provider_order_id",
      "provider_payment_id",
      "paid_at",
      "created_at",
      "updated_at",
      "age_hours",
    ].join(","),
    ...report.settlementQueue.map((item) =>
      [
        item.orderNumber,
        item.orderStatus,
        item.paymentStatus,
        item.customerName,
        item.customerEmail,
        item.currency,
        item.totalAmount.toFixed(2),
        item.providerOrderId ?? "",
        item.providerPaymentId ?? "",
        item.paidAt ?? "",
        item.createdAt,
        item.updatedAt,
        item.ageHours.toFixed(1),
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ]

  return storefrontSettlementGapReportDocumentSchema.parse({
    fileName: `storefront-settlement-gaps-${new Date().toISOString().slice(0, 10)}.csv`,
    csv: lines.join("\n"),
  })
}

export async function getStorefrontAdminOrderOperationsReport(
  database: Kysely<unknown>
) {
  const orders = await readOrders(database)
  const items = orders
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((order) => buildOrderQueueItem(order))

  return storefrontAdminOrderOperationsReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      totalOrders: items.length,
      actionRequiredCount: items.filter((item) => item.queueBucket === "payment_attention").length,
      fulfilmentQueueCount: items.filter((item) => item.queueBucket === "fulfilment").length,
      shipmentQueueCount: items.filter((item) => item.queueBucket === "shipment").length,
      pickupQueueCount: items.filter((item) => item.queueBucket === "pickup").length,
      completedCount: items.filter((item) => item.queueBucket === "completed").length,
      closedCount: items.filter((item) => item.queueBucket === "closed").length,
    },
    items,
  })
}

export async function getStorefrontAdminOrder(
  database: Kysely<unknown>,
  orderId: string
) {
  const order = (await readOrders(database)).find((item) => item.id === orderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId }, 404)
  }

  return storefrontOrderResponseSchema.parse({ item: order })
}

export async function applyStorefrontAdminOrderAction(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown
) {
  const parsed = storefrontAdminOrderActionPayloadSchema.parse(
    payload ?? {}
  ) as StorefrontAdminOrderActionPayload
  const orders = await readOrders(database)
  const order = orders.find((item) => item.id === parsed.orderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId: parsed.orderId }, 404)
  }

  if (parsed.action === "resend_confirmation") {
    const snapshot = await getOrderCustomerSnapshot(database, order.id)

    try {
      await sendStorefrontOrderConfirmedEmail({
        mailboxService: createMailboxService(database, config),
        config,
        settings: await getStorefrontSettings(database),
        order: snapshot.order,
        customerEmail: snapshot.order.shippingAddress.email,
        customerName: snapshot.order.shippingAddress.fullName,
      })
    } catch (error) {
      console.error("Unable to resend storefront order confirmation email.", error)
      throw error
    }

    return storefrontOrderResponseSchema.parse({ item: snapshot.order })
  }

  const now = new Date().toISOString()
  let updatedOrder = order

  if (parsed.action === "cancel") {
    if (order.status === "delivered") {
      throw new ApplicationError(
        "Delivered orders cannot be cancelled from admin operations.",
        { orderId: order.id, status: order.status },
        409
      )
    }

    updatedOrder = storefrontOrderSchema.parse({
      ...transitionOrderStatus(order, "cancelled"),
      shipmentDetails: buildShipmentDetails(order, {
        note: parsed.note ?? order.shipmentDetails?.note ?? "Order cancelled from admin operations.",
        updatedAt: now,
      }),
      timeline: [
        ...order.timeline,
        createTimelineEvent(
          "order_cancelled",
          "Order cancelled",
          parsed.note?.trim() || "Admin operations cancelled this order."
        ),
      ],
      updatedAt: now,
    })

    updatedOrder = await releaseOrderReservation(database, updatedOrder, "order_cancelled")
    const account =
      order.customerAccountId
        ? (await readCustomerAccounts(database)).find((item) => item.id === order.customerAccountId) ?? null
        : null
    updatedOrder = await releaseOrderCoupon(database, updatedOrder, account, "order_cancelled")
  }

  if (parsed.action === "mark_fulfilment_pending") {
    updatedOrder = storefrontOrderSchema.parse({
      ...transitionOrderStatus(order, "fulfilment_pending"),
      shipmentDetails: buildShipmentDetails(order, {
        markedFulfilmentAt: order.shipmentDetails?.markedFulfilmentAt ?? now,
        note:
          parsed.note ??
          order.shipmentDetails?.note ??
          (order.fulfillmentMethod === "store_pickup"
            ? "Pickup order is ready for customer collection."
            : "Order is ready for fulfilment and packing."),
        updatedAt: now,
      }),
      timeline: [
        ...order.timeline,
        createTimelineEvent(
          order.fulfillmentMethod === "store_pickup" ? "pickup_ready" : "fulfilment_ready",
          order.fulfillmentMethod === "store_pickup" ? "Pickup ready" : "Marked for fulfilment",
          parsed.note?.trim() ||
            (order.fulfillmentMethod === "store_pickup"
              ? "Admin marked this order as ready for pickup."
              : "Admin marked this order as ready for fulfilment.")
        ),
      ],
      updatedAt: now,
    })
  }

  if (parsed.action === "mark_shipped") {
    if (order.fulfillmentMethod !== "delivery") {
      throw new ApplicationError(
        "Shipment tracking can only be applied to delivery orders.",
        { orderId: order.id, fulfillmentMethod: order.fulfillmentMethod },
        409
      )
    }

    const trackingId = parsed.trackingId?.trim() ?? ""

    if (!trackingId) {
      throw new ApplicationError("Tracking id is required before marking an order as shipped.", {}, 422)
    }

    updatedOrder = storefrontOrderSchema.parse({
      ...transitionOrderStatus(order, "shipped"),
      shipmentDetails: buildShipmentDetails(order, {
        carrierName: parsed.carrierName,
        trackingId,
        trackingUrl: parsed.trackingUrl,
        note: parsed.note ?? order.shipmentDetails?.note ?? null,
        markedFulfilmentAt: order.shipmentDetails?.markedFulfilmentAt ?? now,
        shippedAt: now,
        updatedAt: now,
      }),
      timeline: [
        ...order.timeline,
        createTimelineEvent(
          "shipment_shipped",
          "Shipment dispatched",
          parsed.note?.trim() ||
            `Admin marked this order as shipped${parsed.carrierName?.trim() ? ` with ${parsed.carrierName.trim()}` : ""}.`
        ),
      ],
      updatedAt: now,
    })
  }

  if (parsed.action === "mark_delivered") {
    updatedOrder = storefrontOrderSchema.parse({
      ...transitionOrderStatus(order, "delivered"),
      shipmentDetails: buildShipmentDetails(order, {
        deliveredAt: now,
        updatedAt: now,
      }),
      timeline: [
        ...order.timeline,
        createTimelineEvent(
          order.fulfillmentMethod === "store_pickup" ? "pickup_collected" : "shipment_delivered",
          order.fulfillmentMethod === "store_pickup" ? "Pickup collected" : "Delivered",
          parsed.note?.trim() ||
            (order.fulfillmentMethod === "store_pickup"
              ? "Admin confirmed that the customer collected the pickup order."
              : "Admin confirmed that the shipment was delivered.")
        ),
      ],
      updatedAt: now,
    })
  }

  await writeOrders(
    database,
    orders.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
  )

  return storefrontOrderResponseSchema.parse({ item: updatedOrder })
}

export async function reconcileRazorpayPayments(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown
) {
  const parsed = storefrontPaymentReconciliationPayloadSchema.parse(payload ?? {})

  if (
    !config.commerce?.razorpay?.enabled ||
    !config.commerce.razorpay.keyId ||
    !config.commerce.razorpay.keySecret
  ) {
    throw new ApplicationError(
      "Razorpay reconciliation requires live Razorpay credentials.",
      {},
      503
    )
  }

  const orders = await readOrders(database)
  const targetOrders = orders
    .filter((order) => {
      if (parsed.orderIds.length > 0) {
        return parsed.orderIds.includes(order.id)
      }

      return (
        order.paymentProvider === "razorpay" &&
        order.paymentMode === "live" &&
        Boolean(order.providerOrderId) &&
        order.status !== "cancelled" &&
        order.status !== "refunded"
      )
    })
    .slice(0, parsed.maxOrders)

  const updatedOrders = [...orders]
  const items: StorefrontPaymentReconciliationItem[] = []

  for (const order of targetOrders) {
    const providerOrderId = order.providerOrderId

    if (!providerOrderId) {
      items.push(
        buildReconciliationItem(
          order,
          order,
          "skipped",
          "Order does not have a Razorpay provider order id."
        )
      )
      continue
    }

    const razorpayPayments = await fetchRazorpayOrderPayments(config, providerOrderId)
    const capturedPayment = razorpayPayments.find((item) => item.status === "captured") ?? null
    const refundedPayment =
      razorpayPayments.find(
        (item) => item.status === "refunded" || item.amountRefunded > 0
      ) ?? null
    const failedPayment = razorpayPayments.find((item) => item.status === "failed") ?? null

    let nextOrder = order
    const couponAccount =
      order.customerAccountId
        ? (await readCustomerAccounts(database)).find((item) => item.id === order.customerAccountId) ?? null
        : null
    let action: StorefrontPaymentReconciliationItem["action"] = "noop"
    let summary = "Razorpay and storefront states are already aligned."

    if (refundedPayment && (order.paymentStatus !== "refunded" || order.status !== "refunded")) {
      const now = new Date().toISOString()
      const refundedOrder = transitionOrderStatus(order, "refunded")
      nextOrder = storefrontOrderSchema.parse({
        ...order,
        ...refundedOrder,
        paymentStatus: "refunded",
        providerPaymentId: refundedPayment.id || order.providerPaymentId,
        refund: buildRefundRecord(order, {
          type: order.refund?.type ?? "full",
          status: "refunded",
          requestedAmount: order.refund?.requestedAmount ?? order.totalAmount,
          currency: order.currency,
          reason: order.refund?.reason ?? null,
          requestedBy: order.refund?.requestedBy ?? "system",
          requestedAt: order.refund?.requestedAt ?? now,
          initiatedAt: order.refund?.initiatedAt ?? now,
          completedAt: now,
          providerRefundId: order.refund?.providerRefundId ?? refundedPayment.id ?? null,
          statusSummary: "Reconciliation confirmed that the refund was completed in Razorpay.",
          updatedAt: now,
        }),
        timeline: appendTimelineIfMissing(order, {
          code: "payment_refunded",
          label: "Payment refunded",
          summary: "Reconciliation confirmed the payment was refunded in Razorpay.",
        }),
        updatedAt: now,
      })
      action = "refunded"
      summary = "Reconciliation updated the order to refunded."
    } else if (
      capturedPayment &&
      order.stockReservation?.status === "released" &&
      order.paymentStatus !== "paid"
    ) {
      nextOrder = storefrontOrderSchema.parse({
        ...order,
        timeline: appendTimelineIfMissing(order, {
          code: "payment_capture_rejected",
          label: "Payment capture rejected",
          summary:
            "Reconciliation ignored a late payment capture because the stock reservation had already been released.",
        }),
        updatedAt: new Date().toISOString(),
      })
      action = "noop"
      summary = "Reconciliation skipped a late captured payment after reservation release."
    } else if (capturedPayment && order.paymentStatus !== "paid") {
      const paidOrder =
        order.status === "created" || order.status === "payment_pending"
          ? transitionOrderStatus(order, "paid")
          : order

      nextOrder = await consumeOrderCoupon(
        database,
        storefrontOrderSchema.parse({
          ...order,
          ...paidOrder,
          paymentStatus: "paid",
          providerPaymentId: capturedPayment.id || order.providerPaymentId,
          timeline: [
            ...appendTimelineIfMissing(order, {
              code: "payment_captured",
              label: "Payment captured",
              summary: "Reconciliation confirmed the payment was captured in Razorpay.",
            }),
            ...(
              order.timeline.some((entry) => entry.code === "order_paid")
                ? []
                : [
                    createTimelineEvent(
                      "order_paid",
                      "Order paid",
                      "Reconciliation confirmed the order is paid and awaiting fulfillment."
                    ),
                  ]
            ),
          ],
          updatedAt: new Date().toISOString(),
        }),
        couponAccount
      )
      action = "paid"
      summary = "Reconciliation updated the order to paid."
    } else if (failedPayment && order.paymentStatus === "pending") {
      const failedOrder = storefrontOrderSchema.parse({
        ...order,
        paymentStatus: "failed",
        refund: order.refund,
        providerPaymentId: failedPayment.id || order.providerPaymentId,
        timeline: appendTimelineIfMissing(order, {
          code: "payment_failed",
          label: "Payment failed",
          summary: "Reconciliation confirmed a failed payment attempt in Razorpay.",
        }),
        updatedAt: new Date().toISOString(),
      })
      nextOrder = await releaseOrderReservation(database, failedOrder, "payment_failed")
      nextOrder = await releaseOrderCoupon(database, nextOrder, couponAccount, "payment_failed")
      action = "failed"
      summary = "Reconciliation updated the order payment status to failed."
    }

    if (nextOrder !== order) {
      const targetIndex = updatedOrders.findIndex((item) => item.id === order.id)

      if (targetIndex >= 0) {
        updatedOrders[targetIndex] = nextOrder
      }

      if (action === "failed") {
        try {
          await sendStorefrontPaymentFailedEmail({
            mailboxService: createMailboxService(database, config),
            config,
            settings: await getStorefrontSettings(database),
            order: nextOrder,
            customerEmail: nextOrder.shippingAddress.email,
            customerName: nextOrder.shippingAddress.fullName,
            failureReason: "Payment is still incomplete. Please retry payment or contact support.",
          })
        } catch (error) {
          console.error("Unable to send storefront payment failed email.", error)
        }
      }
    }

    items.push(buildReconciliationItem(order, nextOrder, action, summary))
  }

  if (items.some((item) => item.action !== "noop" && item.action !== "skipped")) {
    await writeOrders(database, updatedOrders)
  }

  return storefrontPaymentReconciliationResponseSchema.parse({
    processedCount: targetOrders.length,
    matchedCount: items.filter((item) => item.action !== "skipped").length,
    updatedCount: items.filter((item) => !["noop", "skipped"].includes(item.action)).length,
    items,
  })
}

export async function listCustomerOrders(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string
) {
  const customer = await resolveAuthenticatedCustomerAccount(database, config, token)
  const items = (await readOrders(database))
    .filter((item) => orderBelongsToCustomer(item, customer))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  return storefrontOrderListResponseSchema.parse({ items })
}

export async function getCustomerOrder(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  orderId: string
) {
  const customer = await resolveAuthenticatedCustomerAccount(database, config, token)
  const item = (await readOrders(database)).find(
    (order) => order.id === orderId && orderBelongsToCustomer(order, customer)
  )

  if (!item) {
    throw new ApplicationError("Storefront order could not be found.", { orderId }, 404)
  }

  return storefrontOrderResponseSchema.parse({ item })
}

export async function getCustomerOrderReceiptDocument(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  orderId: string
) {
  const { item } = await getCustomerOrder(database, config, token, orderId)
  const timelineDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: item.currency,
    maximumFractionDigits: 2,
  })
  const lineItemsHtml = item.items
    .map(
      (line) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">${line.name}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${line.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${currencyFormatter.format(line.unitPrice)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${currencyFormatter.format(line.lineTotal)}</td>
        </tr>`
    )
    .join("")
  const shippingBlock =
    item.fulfillmentMethod === "store_pickup" && item.pickupLocation
      ? `
        <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">
          <strong>Store pickup</strong><br />
          ${item.pickupLocation.storeName}<br />
          ${item.pickupLocation.line1}${item.pickupLocation.line2 ? `, ${item.pickupLocation.line2}` : ""}<br />
          ${item.pickupLocation.city}, ${item.pickupLocation.state} ${item.pickupLocation.pincode}<br />
          ${item.pickupLocation.country}
        </p>`
      : `
        <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">
          ${item.shippingAddress.fullName}<br />
          ${item.shippingAddress.line1}${item.shippingAddress.line2 ? `, ${item.shippingAddress.line2}` : ""}<br />
          ${item.shippingAddress.city}, ${item.shippingAddress.state} ${item.shippingAddress.pincode}<br />
          ${item.shippingAddress.country}<br />
          ${item.shippingAddress.email}<br />
          ${item.shippingAddress.phoneNumber}
        </p>`
  const taxLinesHtml =
    item.taxBreakdown?.lines
      .map(
        (line) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${line.itemName}</td>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${line.ratePercent.toFixed(2)}%</td>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${currencyFormatter.format(line.taxableAmount)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${currencyFormatter.format(line.taxAmount)}</td>
          </tr>`
      )
      .join("") ?? ""
  const taxSummaryBlock = item.taxBreakdown
    ? `
      <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:20px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">GST review</p>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#4b5563;">
          Regime: ${item.taxBreakdown.regime === "intra_state" ? "Intra-state" : "Inter-state"}<br />
          Seller state: ${item.taxBreakdown.sellerState}<br />
          Customer state: ${item.taxBreakdown.customerState}<br />
          ${item.taxBreakdown.pricesIncludeTax ? "Item prices are treated as GST inclusive." : "Item prices exclude tax."}
        </p>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
          <thead>
            <tr>
              <th style="padding:0 0 10px;text-align:left;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">Item</th>
              <th style="padding:0 0 10px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">Rate</th>
              <th style="padding:0 0 10px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">Taxable</th>
              <th style="padding:0 0 10px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">GST</th>
            </tr>
          </thead>
          <tbody>${taxLinesHtml}</tbody>
        </table>
        <div style="margin-left:auto;max-width:360px;padding-top:16px;">
          <div style="display:flex;justify-content:space-between;gap:18px;padding:4px 0;font-size:13px;color:#4b5563;"><span>Taxable value</span><strong style="color:#111827;">${currencyFormatter.format(item.taxBreakdown.taxableAmount)}</strong></div>
          <div style="display:flex;justify-content:space-between;gap:18px;padding:4px 0;font-size:13px;color:#4b5563;"><span>CGST</span><strong style="color:#111827;">${currencyFormatter.format(item.taxBreakdown.cgstAmount)}</strong></div>
          <div style="display:flex;justify-content:space-between;gap:18px;padding:4px 0;font-size:13px;color:#4b5563;"><span>SGST</span><strong style="color:#111827;">${currencyFormatter.format(item.taxBreakdown.sgstAmount)}</strong></div>
          <div style="display:flex;justify-content:space-between;gap:18px;padding:4px 0;font-size:13px;color:#4b5563;"><span>IGST</span><strong style="color:#111827;">${currencyFormatter.format(item.taxBreakdown.igstAmount)}</strong></div>
          <div style="display:flex;justify-content:space-between;gap:18px;padding:4px 0;font-size:13px;color:#4b5563;"><span>Total GST</span><strong style="color:#111827;">${currencyFormatter.format(item.taxBreakdown.taxAmount)}</strong></div>
        </div>
      </div>`
    : ""

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt ${item.orderNumber}</title>
  </head>
  <body style="margin:0;background:#f5f1ea;padding:32px 18px;font-family:Segoe UI,Arial,sans-serif;color:#111827;">
    <div style="margin:0 auto;max-width:860px;border:1px solid #e5e7eb;background:#ffffff;padding:32px;">
      <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:2px solid #111827;padding-bottom:18px;">
        <div>
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Storefront receipt</p>
          <h1 style="margin:0;font-size:30px;line-height:1.15;">${item.orderNumber}</h1>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#4b5563;">Generated ${timelineDate.format(new Date(item.updatedAt))}</p>
        </div>
        <div style="min-width:220px;text-align:right;">
          <p style="margin:0;font-size:13px;line-height:1.8;color:#4b5563;">Order date: ${timelineDate.format(new Date(item.createdAt))}</p>
          <p style="margin:0;font-size:13px;line-height:1.8;color:#4b5563;">Payment: ${item.paymentStatus.replaceAll("_", " ")}</p>
          <p style="margin:0;font-size:13px;line-height:1.8;color:#4b5563;">Status: ${item.status.replaceAll("_", " ")}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;padding:24px 0;border-bottom:1px solid #e5e7eb;">
        <div>
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">Billing</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">
            ${item.billingAddress.fullName}<br />
            ${item.billingAddress.line1}${item.billingAddress.line2 ? `, ${item.billingAddress.line2}` : ""}<br />
            ${item.billingAddress.city}, ${item.billingAddress.state} ${item.billingAddress.pincode}<br />
            ${item.billingAddress.country}<br />
            ${item.billingAddress.email}<br />
            ${item.billingAddress.phoneNumber}
          </p>
        </div>
        <div>
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">Fulfilment</p>
          ${shippingBlock}
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:24px;">
        <thead>
          <tr>
            <th style="padding:0 0 12px;text-align:left;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">Item</th>
            <th style="padding:0 0 12px;text-align:center;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">Qty</th>
            <th style="padding:0 0 12px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">Rate</th>
            <th style="padding:0 0 12px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">Amount</th>
          </tr>
        </thead>
        <tbody>${lineItemsHtml}</tbody>
      </table>

      <div style="margin-left:auto;max-width:320px;padding-top:24px;">
        <div style="display:flex;justify-content:space-between;gap:18px;padding:6px 0;font-size:14px;color:#4b5563;"><span>Subtotal</span><strong style="color:#111827;">${currencyFormatter.format(item.subtotalAmount)}</strong></div>
        <div style="display:flex;justify-content:space-between;gap:18px;padding:6px 0;font-size:14px;color:#4b5563;"><span>Discount</span><strong style="color:#111827;">-${currencyFormatter.format(item.discountAmount)}</strong></div>
        <div style="display:flex;justify-content:space-between;gap:18px;padding:6px 0;font-size:14px;color:#4b5563;"><span>Shipping</span><strong style="color:#111827;">${currencyFormatter.format(item.shippingAmount)}</strong></div>
        <div style="display:flex;justify-content:space-between;gap:18px;padding:6px 0;font-size:14px;color:#4b5563;"><span>Handling</span><strong style="color:#111827;">${currencyFormatter.format(item.handlingAmount)}</strong></div>
        <div style="display:flex;justify-content:space-between;gap:18px;padding:12px 0 0;margin-top:8px;border-top:2px solid #111827;font-size:16px;"><span><strong>Total</strong></span><strong>${currencyFormatter.format(item.totalAmount)}</strong></div>
      </div>
      ${taxSummaryBlock}
    </div>
  </body>
</html>`

  return storefrontReceiptDocumentSchema.parse({
    fileName: `${item.orderNumber.toLowerCase()}.html`,
    html,
  })
}

export async function trackOrderByReference(database: Kysely<unknown>, query: unknown) {
  const parsed = storefrontOrderTrackingLookupSchema.parse(query)
  const item = (await readOrders(database)).find(
    (order) =>
      order.orderNumber === parsed.orderNumber &&
      order.shippingAddress.email.toLowerCase() === parsed.email.toLowerCase()
  )

  if (!item) {
    throw new ApplicationError(
      "No order matched the supplied order number and email.",
      {},
      404
    )
  }

  return storefrontOrderResponseSchema.parse({ item })
}

export async function getOrderCustomerSnapshot(database: Kysely<unknown>, orderId: string) {
  const orders = await readOrders(database)
  const order = orders.find((item) => item.id === orderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId }, 404)
  }

  const contact = await getContact(database, systemActor, order.coreContactId)
  return {
    order,
    contact: contact.item,
  }
}
