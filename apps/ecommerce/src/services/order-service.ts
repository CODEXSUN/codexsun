import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { coreTableNames } from "../../../core/database/table-names.js"
import {
  createContact,
  getContact,
  listContacts,
} from "../../../core/src/services/contact-service.js"
import { productSchema, type Product } from "../../../core/shared/index.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { AuthUser } from "../../../cxapp/shared/schemas/auth.js"
import {
  storefrontCheckoutPayloadSchema,
  storefrontCheckoutResponseSchema,
  storefrontOrderListResponseSchema,
  storefrontOrderResponseSchema,
  storefrontOrderSchema,
  storefrontOrderTrackingLookupSchema,
  storefrontPaymentVerificationPayloadSchema,
  type CustomerAccount,
  type StorefrontOrder,
  type StorefrontOrderTimelineEvent,
} from "../../shared/index.js"

import { createRazorpayPaymentSession, verifyRazorpaySignature } from "./razorpay-service.js"
import { resolveAuthenticatedCustomerAccount } from "./customer-service.js"

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
  const items = await listJsonStorePayloads<StorefrontOrder>(
    database,
    ecommerceTableNames.orders
  )

  return items.map((item) => storefrontOrderSchema.parse(item))
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

async function readCoreProducts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Product>(database, coreTableNames.products)

  return items.map((item) => productSchema.parse(item))
}

function nextOrderNumber(existingOrders: StorefrontOrder[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const countForToday =
    existingOrders.filter((item) => item.orderNumber.includes(today)).length + 1

  return `ECM-${today}-${String(countForToday).padStart(4, "0")}`
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
  const existingOrders = await readOrders(database)
  const catalog = await readCoreProducts(database)
  const now = new Date().toISOString()

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

    return {
      id: `order-item:${randomUUID()}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brandName: product.brandName,
      imageUrl: product.primaryImageUrl,
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
  const freeShippingThreshold =
    config.commerce?.storefront?.freeShippingThreshold ?? 3999
  const defaultShippingAmount =
    config.commerce?.storefront?.defaultShippingAmount ?? 149
  const shippingAmount = subtotalAmount >= freeShippingThreshold ? 0 : defaultShippingAmount
  const totalAmount = subtotalAmount + shippingAmount
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
    paymentStatus: "pending",
    paymentProvider: "razorpay",
    paymentMode: config.commerce?.razorpay?.enabled ? "live" : "mock",
    providerOrderId: null,
    providerPaymentId: null,
    shippingAddress: parsed.shippingAddress,
    billingAddress: parsed.billingAddress,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalAmount,
    discountAmount,
    shippingAmount,
    totalAmount,
    currency: "INR",
    notes: normalizeOptionalString(parsed.notes),
    timeline: [
      createTimelineEvent(
        "order_created",
        "Order created",
        "Checkout order was created and is awaiting payment."
      ),
    ],
    createdAt: now,
    updatedAt: now,
  })

  const payment = await createRazorpayPaymentSession(config, order)
  const nextOrder = storefrontOrderSchema.parse({
    ...order,
    paymentMode: payment.mode,
    providerOrderId: payment.providerOrderId,
    updatedAt: new Date().toISOString(),
  })

  await writeOrders(database, [nextOrder, ...existingOrders])

  return storefrontCheckoutResponseSchema.parse({
    order: nextOrder,
    payment,
  })
}

export async function verifyCheckoutPayment(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown
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

  const updatedOrder = storefrontOrderSchema.parse({
    ...order,
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
    .filter((item) => item.customerAccountId === customer.id)
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
    (order) => order.id === orderId && order.customerAccountId === customer.id
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
