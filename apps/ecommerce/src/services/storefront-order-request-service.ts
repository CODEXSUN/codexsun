import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type {
  CustomerAccount,
  StorefrontOrder,
  StorefrontOrderRequest,
  StorefrontOrderRequestCreatePayload,
  StorefrontOrderRequestReviewPayload,
  StorefrontOrderRequestView,
} from "../../shared/index.js"
import {
  storefrontOrderRequestCreatePayloadSchema,
  storefrontOrderRequestListResponseSchema,
  storefrontOrderRequestQueueReportSchema,
  storefrontOrderRequestResponseSchema,
  storefrontOrderRequestReviewPayloadSchema,
  storefrontOrderRequestSchema,
  storefrontOrderRequestViewSchema,
} from "../../shared/index.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

import { ecommerceTableNames } from "../../database/table-names.js"
import { resolveAuthenticatedCustomerAccount } from "./customer-service.js"
import {
  applyStorefrontAdminOrderAction,
  getStorefrontAdminOrder,
  requestStorefrontRefund,
} from "./order-service.js"
import { readStorefrontOrders } from "./storefront-order-storage.js"

function orderBelongsToCustomer(order: StorefrontOrder, customer: CustomerAccount) {
  if (order.customerAccountId === customer.id) {
    return true
  }

  const customerEmail = customer.email.trim().toLowerCase()
  return (
    order.coreContactId === customer.coreContactId ||
    order.shippingAddress.email.trim().toLowerCase() === customerEmail
  )
}

export async function readStorefrontOrderRequests(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<StorefrontOrderRequest>(
    database,
    ecommerceTableNames.orderRequests
  )

  return items.map((item) => storefrontOrderRequestSchema.parse(item))
}

async function writeStorefrontOrderRequests(
  database: Kysely<unknown>,
  items: StorefrontOrderRequest[]
) {
  await replaceJsonStoreRecords(
    database,
    ecommerceTableNames.orderRequests,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "storefront-order-request",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

function buildRequestNumber(existingItems: StorefrontOrderRequest[]) {
  return `REQ-${String(existingItems.length + 1).padStart(4, "0")}`
}

function toRequestView(item: StorefrontOrderRequest, order: StorefrontOrder) {
  const orderItem =
    item.orderItemId != null
      ? order.items.find((entry) => entry.id === item.orderItemId) ?? null
      : null

  return storefrontOrderRequestViewSchema.parse({
    ...item,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    currency: order.currency,
    itemName: orderItem?.name ?? null,
  })
}

function sortRequests(items: StorefrontOrderRequest[]) {
  return [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function ensureCancellationEligibility(order: StorefrontOrder) {
  if (!["created", "payment_pending", "paid", "fulfilment_pending"].includes(order.status)) {
    throw new ApplicationError(
      "Cancellation request is no longer available for this order state.",
      { orderId: order.id, status: order.status },
      409
    )
  }
}

function ensureReturnEligibility(order: StorefrontOrder) {
  if (order.status !== "delivered") {
    throw new ApplicationError(
      "Return request is only available after delivery or collection is complete.",
      { orderId: order.id, status: order.status },
      409
    )
  }
}

export async function listCustomerOrderRequests(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  orderId?: string | null
) {
  const [customer, items, orders] = await Promise.all([
    resolveAuthenticatedCustomerAccount(database, config, token),
    readStorefrontOrderRequests(database),
    readStorefrontOrders(database),
  ])
  const orderLookup = new Map(orders.map((item) => [item.id, item]))

  return storefrontOrderRequestListResponseSchema.parse({
    items: sortRequests(
      items.filter((item) => {
        if (item.customerAccountId !== customer.id) {
          return false
        }

        if (orderId && item.orderId !== orderId) {
          return false
        }

        return true
      })
    )
      .map((item) => {
        const order = orderLookup.get(item.orderId)
        return order ? toRequestView(item, order) : null
      })
      .filter((item): item is StorefrontOrderRequestView => Boolean(item)),
  })
}

export async function createCustomerOrderRequest(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  payload: unknown
) {
  const parsed = storefrontOrderRequestCreatePayloadSchema.parse(
    payload
  ) satisfies StorefrontOrderRequestCreatePayload
  const [customer, requests, orders] = await Promise.all([
    resolveAuthenticatedCustomerAccount(database, config, token),
    readStorefrontOrderRequests(database),
    readStorefrontOrders(database),
  ])
  const order = orders.find((item) => item.id === parsed.orderId) ?? null

  if (!order || !orderBelongsToCustomer(order, customer)) {
    throw new ApplicationError("Storefront order could not be found.", { orderId: parsed.orderId }, 404)
  }

  if (parsed.type === "cancellation") {
    ensureCancellationEligibility(order)
  } else {
    ensureReturnEligibility(order)
  }

  if (parsed.orderItemId && !order.items.some((item) => item.id === parsed.orderItemId)) {
    throw new ApplicationError("Selected order item could not be found.", {}, 404)
  }

  const activeRequest = requests.find(
    (item) =>
      item.orderId === order.id &&
      item.type === parsed.type &&
      ["requested", "in_review", "approved"].includes(item.status)
  )

  if (activeRequest) {
    throw new ApplicationError(
      "A similar request is already active for this order.",
      { orderId: order.id, requestId: activeRequest.id },
      409
    )
  }

  const now = new Date().toISOString()
  const request = storefrontOrderRequestSchema.parse({
    id: `storefront-order-request:${randomUUID()}`,
    requestNumber: buildRequestNumber(requests),
    type: parsed.type,
    status: "requested",
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderItemId: parsed.orderItemId,
    customerAccountId: customer.id,
    coreContactId: customer.coreContactId,
    customerName: customer.displayName,
    customerEmail: customer.email,
    customerPhone: customer.phoneNumber,
    reason: parsed.reason,
    adminNote: null,
    requestedAt: now,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
  })

  await writeStorefrontOrderRequests(database, sortRequests([request, ...requests]))

  return storefrontOrderRequestResponseSchema.parse({
    item: toRequestView(request, order),
  })
}

export async function getStorefrontOrderRequestQueueReport(database: Kysely<unknown>) {
  const [requests, orders] = await Promise.all([
    readStorefrontOrderRequests(database),
    readStorefrontOrders(database),
  ])
  const orderLookup = new Map(orders.map((item) => [item.id, item]))
  const sortedItems = sortRequests(requests)

  return storefrontOrderRequestQueueReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      totalRequests: sortedItems.length,
      cancellationCount: sortedItems.filter((item) => item.type === "cancellation").length,
      returnCount: sortedItems.filter((item) => item.type === "return").length,
      requestedCount: sortedItems.filter((item) => item.status === "requested").length,
      inReviewCount: sortedItems.filter((item) => item.status === "in_review").length,
    },
    items: sortedItems
      .map((item) => {
        const order = orderLookup.get(item.orderId)
        return order ? toRequestView(item, order) : null
      })
      .filter((item): item is StorefrontOrderRequestView => Boolean(item)),
  })
}

export async function reviewStorefrontOrderRequest(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown
) {
  const parsed = storefrontOrderRequestReviewPayloadSchema.parse(
    payload
  ) satisfies StorefrontOrderRequestReviewPayload
  const requests = await readStorefrontOrderRequests(database)
  const request = requests.find((item) => item.id === parsed.requestId) ?? null

  if (!request) {
    throw new ApplicationError("Order request could not be found.", { requestId: parsed.requestId }, 404)
  }

  const now = new Date().toISOString()
  let nextRequest = storefrontOrderRequestSchema.parse({
    ...request,
    status: parsed.status,
    adminNote: parsed.adminNote ?? request.adminNote,
    reviewedAt: now,
    updatedAt: now,
  })

  if (parsed.status === "approved") {
    if (request.type === "cancellation") {
      const adminOrder = await getStorefrontAdminOrder(database, request.orderId)
      ensureCancellationEligibility(adminOrder.item)

      if (adminOrder.item.paymentStatus === "paid") {
        await requestStorefrontRefund(database, {
          orderId: request.orderId,
          reason: request.reason,
          requestedBy: "customer",
        })
      }

      await applyStorefrontAdminOrderAction(database, config, {
        orderId: request.orderId,
        action: "cancel",
        note:
          parsed.adminNote?.trim() ||
          "Cancellation request approved from customer workflow.",
      })
    } else {
      const adminOrder = await getStorefrontAdminOrder(database, request.orderId)
      ensureReturnEligibility(adminOrder.item)
      await requestStorefrontRefund(database, {
        orderId: request.orderId,
        reason: request.reason,
        requestedBy: "customer",
      })
    }
  }

  const updatedRequests = sortRequests(
    requests.map((item) => (item.id === request.id ? nextRequest : item))
  )
  await writeStorefrontOrderRequests(database, updatedRequests)

  const latestOrder = await getStorefrontAdminOrder(database, request.orderId)

  return storefrontOrderRequestResponseSchema.parse({
    item: toRequestView(nextRequest, latestOrder.item),
  })
}
