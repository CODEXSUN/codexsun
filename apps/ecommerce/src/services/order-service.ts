import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { recordMonitoringEvent } from "../../../framework/src/runtime/monitoring/monitoring-service.js"
import {
  createContact,
  getContact,
  listContacts,
} from "../../../core/src/services/contact-service.js"
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
  storefrontCheckoutPayloadSchema,
  storefrontCheckoutResponseSchema,
  storefrontOrderListResponseSchema,
  storefrontOrderResponseSchema,
  storefrontOrderSchema,
  storefrontPaymentOperationsReportSchema,
  storefrontRefundStatusUpdatePayloadSchema,
  storefrontOrderTrackingLookupSchema,
  storefrontRefundRequestPayloadSchema,
  storefrontPaymentWebhookEventSchema,
  storefrontPaymentReconciliationPayloadSchema,
  storefrontPaymentReconciliationResponseSchema,
  storefrontPaymentVerificationPayloadSchema,
  type StorefrontSettings,
  type StorefrontPaymentSession,
  type StorefrontRefundRecord,
  type CustomerAccount,
  type StorefrontAdminOrderActionPayload,
  type StorefrontAdminOrderQueueBucket,
  type StorefrontAdminOrderQueueItem,
  type StorefrontOrder,
  type StorefrontPaymentExceptionItem,
  type StorefrontPaymentSettlementItem,
  type StorefrontPaymentWebhookEvent,
  type StorefrontPaymentWebhookExceptionItem,
  type StorefrontPaymentReconciliationItem,
  type StorefrontRefundQueueItem,
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
import { resolveAuthenticatedCustomerAccount } from "./customer-service.js"
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
    availableQuantity: product.stockItems
      .filter((item) => item.isActive)
      .reduce((sum, item) => sum + Math.max(0, item.quantity - item.reservedQuantity), 0),
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
  subtotalAmount: number
) {
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
  const globalShippingAmount =
    subtotalAmount >= settings.freeShippingThreshold ? 0 : settings.defaultShippingAmount

  return {
    shippingAmount:
      explicitShippingAmount + (fallbackShippingApplies ? globalShippingAmount : 0),
    handlingAmount:
      explicitHandlingAmount +
      (fallbackHandlingApplies && items.length > 0 ? settings.defaultHandlingAmount : 0),
  }
}

export async function createCheckoutOrder(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown,
  token?: string | null
) {
  let orderCreationAttempted = false

  try {
    const parsed = storefrontCheckoutPayloadSchema.parse(payload)
    const customer = token
      ? await resolveAuthenticatedCustomerAccount(database, config, token)
      : null
    const settings = await getStorefrontSettings(database)
    const existingOrders = await readOrders(database)
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
    const { shippingAmount, handlingAmount } =
      parsed.fulfillmentMethod === "store_pickup"
        ? { shippingAmount: 0, handlingAmount: 0 }
        : calculateChargeTotals(chargeInputs, settings, subtotalAmount)
    const totalAmount = subtotalAmount + shippingAmount + handlingAmount
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
      notes: normalizeOptionalString(parsed.notes),
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
      return Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= 15 * 60 * 1000
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
    const createdOrder = storefrontOrderSchema.parse({
      id: `storefront-order:${randomUUID()}`,
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
      shipmentDetails: null,
      refund: null,
      providerOrderId: null,
      providerPaymentId: null,
      checkoutFingerprint,
      shippingAddress: parsed.shippingAddress,
      billingAddress: parsed.billingAddress,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalAmount,
      discountAmount,
      shippingAmount,
      handlingAmount,
      totalAmount,
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
        timeline: [
          ...order.timeline,
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
        providerOrderId: payment.providerOrderId,
        timeline: [
          ...order.timeline,
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

    const paidOrder = transitionOrderStatus(order, "paid")
    const updatedOrder = storefrontOrderSchema.parse({
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

    if (event === "payment.captured") {
      if (order.paymentStatus !== "paid") {
        const paidOrder = transitionOrderStatus(order, "paid")
        nextOrder = storefrontOrderSchema.parse({
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
        })
      }
    } else if (event === "payment.failed") {
      nextOrder = storefrontOrderSchema.parse({
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
    } else if (capturedPayment && order.paymentStatus !== "paid") {
      const paidOrder =
        order.status === "created" || order.status === "payment_pending"
          ? transitionOrderStatus(order, "paid")
          : order

      nextOrder = storefrontOrderSchema.parse({
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
      })
      action = "paid"
      summary = "Reconciliation updated the order to paid."
    } else if (failedPayment && order.paymentStatus === "pending") {
      nextOrder = storefrontOrderSchema.parse({
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
