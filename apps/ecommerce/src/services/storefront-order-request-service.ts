import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type {
  CustomerAccount,
  StorefrontOrder,
  StorefrontOrderRequest,
  StorefrontOrderRequestCreatePayload,
  StorefrontOrderRequestReviewPayload,
  StorefrontOrderRequestStatus,
  StorefrontOrderRequestView,
  StorefrontRmaCustomerServiceItem,
} from "../../shared/index.js"
import {
  storefrontOrderRequestCreatePayloadSchema,
  storefrontOrderRequestListResponseSchema,
  storefrontOrderRequestQueueReportSchema,
  storefrontOrderRequestResponseSchema,
  storefrontOrderRequestReviewPayloadSchema,
  storefrontOrderRequestSchema,
  storefrontOrderRequestViewSchema,
  storefrontRmaCustomerServiceReportSchema,
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
import {
  createLinkedSupportCaseForOrderRequest,
  readStorefrontSupportCases,
} from "./storefront-support-service.js"

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

function buildRmaNumber(existingItems: StorefrontOrderRequest[]) {
  return `RMA-${String(existingItems.filter((item) => item.type === "return").length + 1).padStart(4, "0")}`
}

function toRequestView(
  item: StorefrontOrderRequest,
  order: StorefrontOrder,
  supportCaseLookup?: Map<string, { caseNumber: string; status: string }>
) {
  const orderItem =
    item.orderItemId != null
      ? order.items.find((entry) => entry.id === item.orderItemId) ?? null
      : null
  const supportCase =
    item.linkedSupportCaseId && supportCaseLookup
      ? supportCaseLookup.get(item.linkedSupportCaseId) ?? null
      : null

  return storefrontOrderRequestViewSchema.parse({
    ...item,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    currency: order.currency,
    itemName: orderItem?.name ?? null,
    supportCaseNumber: supportCase?.caseNumber ?? null,
    supportCaseStatus: supportCase?.status ?? null,
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

function isRequestOperationallyActive(status: StorefrontOrderRequestStatus) {
  return [
    "requested",
    "in_review",
    "awaiting_return",
    "refund_pending",
  ].includes(status)
}

function summarizeRmaItem(input: {
  request: StorefrontOrderRequest
  order: StorefrontOrder
}) {
  if (input.request.type === "cancellation") {
    return `Cancellation workflow for ${input.order.orderNumber} is ${input.request.status.replaceAll("_", " ")}.`
  }

  return `Return workflow for ${input.order.orderNumber} is ${input.request.status.replaceAll("_", " ")}.`
}

function deriveEscalationBucket(input: {
  request: StorefrontOrderRequest
  order: StorefrontOrder
}) {
  if (input.request.status === "completed" || input.request.status === "rejected") {
    return "resolved" as const
  }

  if (input.request.status === "refund_pending") {
    return input.order.erpReturnLink?.status === "failed" ? "erp_reconciliation" as const : "finance_refund" as const
  }

  if (input.request.status === "awaiting_return") {
    return "awaiting_customer_return" as const
  }

  return "ops_review" as const
}

export async function listCustomerOrderRequests(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  orderId?: string | null
) {
  const [customer, items, orders, supportCases] = await Promise.all([
    resolveAuthenticatedCustomerAccount(database, config, token),
    readStorefrontOrderRequests(database),
    readStorefrontOrders(database),
    readStorefrontSupportCases(database),
  ])
  const orderLookup = new Map(orders.map((item) => [item.id, item]))
  const supportCaseLookup = new Map(
    supportCases.map((item) => [item.id, { caseNumber: item.caseNumber, status: item.status }])
  )

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
        return order ? toRequestView(item, order, supportCaseLookup) : null
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
      isRequestOperationallyActive(item.status)
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
    rmaNumber: parsed.type === "return" ? buildRmaNumber(requests) : null,
    type: parsed.type,
    status: "requested",
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderItemId: parsed.orderItemId,
    linkedSupportCaseId: null,
    customerAccountId: customer.id,
    coreContactId: customer.coreContactId,
    customerName: customer.displayName,
    customerEmail: customer.email,
    customerPhone: customer.phoneNumber,
    reason: parsed.reason,
    adminNote: null,
    requestedAt: now,
    approvedAt: null,
    reviewedAt: null,
    receivedAt: null,
    completedAt: null,
    resolutionCode: null,
    createdAt: now,
    updatedAt: now,
  })
  const supportCase = await createLinkedSupportCaseForOrderRequest(database, {
    order,
    request,
  })
  const linkedRequest = storefrontOrderRequestSchema.parse({
    ...request,
    linkedSupportCaseId: supportCase.id,
    updatedAt: now,
  })

  await writeStorefrontOrderRequests(database, sortRequests([linkedRequest, ...requests]))

  return storefrontOrderRequestResponseSchema.parse({
    item: toRequestView(
      linkedRequest,
      order,
      new Map([[supportCase.id, { caseNumber: supportCase.caseNumber, status: supportCase.status }]])
    ),
  })
}

export async function getStorefrontOrderRequestQueueReport(database: Kysely<unknown>) {
  const [requests, orders, supportCases] = await Promise.all([
    readStorefrontOrderRequests(database),
    readStorefrontOrders(database),
    readStorefrontSupportCases(database),
  ])
  const orderLookup = new Map(orders.map((item) => [item.id, item]))
  const supportCaseLookup = new Map(
    supportCases.map((item) => [item.id, { caseNumber: item.caseNumber, status: item.status }])
  )
  const sortedItems = sortRequests(requests)

  return storefrontOrderRequestQueueReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      totalRequests: sortedItems.length,
      cancellationCount: sortedItems.filter((item) => item.type === "cancellation").length,
      returnCount: sortedItems.filter((item) => item.type === "return").length,
      requestedCount: sortedItems.filter((item) => item.status === "requested").length,
      inReviewCount: sortedItems.filter((item) => item.status === "in_review").length,
      awaitingReturnCount: sortedItems.filter((item) => item.status === "awaiting_return").length,
      refundPendingCount: sortedItems.filter((item) => item.status === "refund_pending").length,
      completedCount: sortedItems.filter((item) => item.status === "completed").length,
    },
    items: sortedItems
      .map((item) => {
        const order = orderLookup.get(item.orderId)
        return order ? toRequestView(item, order, supportCaseLookup) : null
      })
      .filter((item): item is StorefrontOrderRequestView => Boolean(item)),
  })
}

export async function getStorefrontRmaCustomerServiceReport(database: Kysely<unknown>) {
  const [requests, orders, supportCases] = await Promise.all([
    readStorefrontOrderRequests(database),
    readStorefrontOrders(database),
    readStorefrontSupportCases(database),
  ])
  const orderLookup = new Map(orders.map((item) => [item.id, item]))
  const supportCaseLookup = new Map(supportCases.map((item) => [item.id, item]))

  const items: StorefrontRmaCustomerServiceItem[] = sortRequests(requests)
    .map((request) => {
      const order = orderLookup.get(request.orderId)

      if (!order) {
        return null
      }

      const supportCase =
        request.linkedSupportCaseId != null
          ? supportCaseLookup.get(request.linkedSupportCaseId) ?? null
          : null

      return {
        requestId: request.id,
        requestNumber: request.requestNumber,
        rmaNumber: request.rmaNumber,
        type: request.type,
        status: request.status,
        orderId: order.id,
        orderNumber: order.orderNumber,
        supportCaseId: supportCase?.id ?? null,
        supportCaseNumber: supportCase?.caseNumber ?? null,
        supportStatus: supportCase?.status ?? null,
        assignedTeam: supportCase?.assignedTeam ?? null,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        refundStatus: order.refund?.status ?? null,
        erpReturnStatus: order.erpReturnLink?.returnStatus ?? null,
        customerName: request.customerName,
        totalAmount: order.totalAmount,
        currency: order.currency,
        requestedAt: request.requestedAt,
        updatedAt: request.updatedAt,
        issueSummary: summarizeRmaItem({ request, order }),
        escalationBucket: deriveEscalationBucket({ request, order }),
      } satisfies StorefrontRmaCustomerServiceItem
    })
    .filter((item): item is StorefrontRmaCustomerServiceItem => item !== null)

  return storefrontRmaCustomerServiceReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      totalItems: items.length,
      opsReviewCount: items.filter((item) => item.escalationBucket === "ops_review").length,
      awaitingCustomerReturnCount: items.filter(
        (item) => item.escalationBucket === "awaiting_customer_return"
      ).length,
      financeRefundCount: items.filter((item) => item.escalationBucket === "finance_refund").length,
      erpReconciliationCount: items.filter(
        (item) => item.escalationBucket === "erp_reconciliation"
      ).length,
      resolvedCount: items.filter((item) => item.escalationBucket === "resolved").length,
    },
    items,
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
  const adminOrder = await getStorefrontAdminOrder(database, request.orderId)
  let nextStatus = parsed.status
  let nextRequest = storefrontOrderRequestSchema.parse({
    ...request,
    status: nextStatus,
    adminNote: parsed.adminNote ?? request.adminNote,
    reviewedAt: now,
    approvedAt:
      parsed.status === "awaiting_return" || parsed.status === "refund_pending" || parsed.status === "completed"
        ? request.approvedAt ?? now
        : request.approvedAt,
    receivedAt:
      parsed.status === "refund_pending" && request.type === "return"
        ? request.receivedAt ?? now
        : request.receivedAt,
    completedAt: parsed.status === "completed" ? request.completedAt ?? now : request.completedAt,
    resolutionCode:
      parsed.status === "rejected"
        ? "request_rejected"
        : parsed.status === "completed" && request.type === "cancellation"
          ? "cancelled_before_dispatch"
          : parsed.status === "completed"
            ? "refund_completed"
            : request.resolutionCode,
    updatedAt: now,
  })

  if (parsed.status === "refund_pending" || parsed.status === "completed") {
    if (request.type === "cancellation") {
      ensureCancellationEligibility(adminOrder.item)

      if (adminOrder.item.paymentStatus === "paid" && adminOrder.item.refund?.status !== "requested") {
        await requestStorefrontRefund(database, {
          orderId: request.orderId,
          reason: request.reason,
          requestedBy: "customer",
        })
      }

      if (adminOrder.item.status !== "cancelled") {
        await applyStorefrontAdminOrderAction(database, config, {
          orderId: request.orderId,
          action: "cancel",
          note:
            parsed.adminNote?.trim() ||
            "Cancellation request approved from customer workflow.",
        })
      }

      nextStatus = adminOrder.item.paymentStatus === "paid" ? "refund_pending" : "completed"
      nextRequest = storefrontOrderRequestSchema.parse({
        ...nextRequest,
        status: nextStatus,
        completedAt: nextStatus === "completed" ? nextRequest.completedAt ?? now : null,
      })
    } else {
      ensureReturnEligibility(adminOrder.item)

      if (adminOrder.item.paymentStatus === "paid" && adminOrder.item.refund?.status !== "requested") {
        await requestStorefrontRefund(database, {
          orderId: request.orderId,
          reason: request.reason,
          requestedBy: "customer",
        })
      }

      nextStatus = adminOrder.item.paymentStatus === "paid" ? "refund_pending" : "completed"
      nextRequest = storefrontOrderRequestSchema.parse({
        ...nextRequest,
        status: nextStatus,
        receivedAt: nextRequest.receivedAt ?? now,
        resolutionCode:
          nextStatus === "completed" ? "return_received" : nextRequest.resolutionCode,
        completedAt: nextStatus === "completed" ? nextRequest.completedAt ?? now : null,
      })
    }
  } else if (parsed.status === "awaiting_return") {
    if (request.type !== "return") {
      throw new ApplicationError(
        "Awaiting-return status is only valid for return requests.",
        { requestId: request.id, type: request.type },
        409
      )
    }

    ensureReturnEligibility(adminOrder.item)
    nextRequest = storefrontOrderRequestSchema.parse({
      ...nextRequest,
      approvedAt: request.approvedAt ?? now,
    })
  }

  const updatedRequests = sortRequests(
    requests.map((item) => (item.id === request.id ? nextRequest : item))
  )
  await writeStorefrontOrderRequests(database, updatedRequests)

  const latestOrder = await getStorefrontAdminOrder(database, request.orderId)
  const supportCases = await readStorefrontSupportCases(database)
  const supportCaseLookup = new Map(
    supportCases.map((item) => [item.id, { caseNumber: item.caseNumber, status: item.status }])
  )

  return storefrontOrderRequestResponseSchema.parse({
    item: toRequestView(nextRequest, latestOrder.item, supportCaseLookup),
  })
}
