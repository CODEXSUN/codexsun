import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import {
  createContact,
  getContact,
  listContacts,
} from "../../../core/src/services/contact-service.js"
import { type Product } from "../../../core/shared/index.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { AuthUser } from "../../../cxapp/shared/schemas/auth.js"
import { createMailboxService } from "../../../cxapp/src/services/service-factory.js"
import {
  storefrontCheckoutPayloadSchema,
  storefrontCheckoutResponseSchema,
  storefrontOrderListResponseSchema,
  storefrontOrderResponseSchema,
  storefrontOrderSchema,
  storefrontOrderTrackingLookupSchema,
  storefrontPaymentVerificationPayloadSchema,
  type StorefrontSettings,
  type StorefrontPaymentSession,
  type CustomerAccount,
  type StorefrontOrder,
  type StorefrontOrderTimelineEvent,
} from "../../shared/index.js"

import { createRazorpayPaymentSession, verifyRazorpaySignature } from "./razorpay-service.js"
import { resolveAuthenticatedCustomerAccount } from "./customer-service.js"
import { readCoreProducts } from "./catalog-service.js"
import { getStorefrontSettings } from "./storefront-settings-service.js"
import { sendStorefrontOrderConfirmedEmail } from "./storefront-mail-service.js"
import { readStorefrontOrders } from "./storefront-order-storage.js"

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
  const order = storefrontOrderSchema.parse({
    id: `storefront-order:${randomUUID()}`,
    orderNumber: nextOrderNumber(existingOrders),
    customerAccountId: customer?.id ?? null,
    coreContactId,
    status: "pending_payment",
    paymentStatus: parsed.paymentMethod === "online" ? "pending" : "pending",
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
    providerOrderId: null,
    providerPaymentId: null,
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
          ? "Checkout order was created and is awaiting pickup confirmation."
          : "Checkout order was created and is awaiting payment."
      ),
    ],
    createdAt: now,
    updatedAt: now,
  })

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
      status: "confirmed",
      timeline: [
        ...order.timeline,
        createTimelineEvent(
          "pickup_reserved",
          "Pickup reserved",
          "Order is reserved for store pickup. Payment will be collected at the retail store."
        ),
        createTimelineEvent(
          "order_confirmed",
          "Order confirmed",
          "The pickup order is confirmed and waiting for store collection."
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
      updatedAt: new Date().toISOString(),
    })
  }

  await writeOrders(database, [nextOrder, ...existingOrders])

  return storefrontCheckoutResponseSchema.parse({
    order: nextOrder,
    payment,
  })
}

export async function verifyCheckoutPayment(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown,
  token?: string | null
) {
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

  const updatedOrder = storefrontOrderSchema.parse({
    ...order,
    customerAccountId: order.customerAccountId ?? verifiedCustomer?.id ?? null,
    coreContactId: verifiedCustomer?.coreContactId ?? order.coreContactId,
    status: "confirmed",
    paymentStatus: "paid",
    providerPaymentId: parsed.providerPaymentId,
    timeline: [
      ...order.timeline,
      createTimelineEvent(
        "payment_captured",
        "Payment captured",
        "Razorpay payment was verified successfully."
      ),
      createTimelineEvent(
        "order_confirmed",
        "Order confirmed",
        "The order is confirmed and queued for fulfillment."
      ),
    ],
    updatedAt: new Date().toISOString(),
  })

  await writeOrders(
    database,
    orders.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
  )

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
