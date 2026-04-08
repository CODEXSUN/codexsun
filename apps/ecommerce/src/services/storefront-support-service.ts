import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type {
  CustomerAccount,
  StorefrontOrder,
  StorefrontOrderRequest,
  StorefrontSupportCase,
  StorefrontSupportCaseAdminUpdatePayload,
  StorefrontSupportCaseCreatePayload,
  StorefrontSupportCaseView,
} from "../../shared/index.js"
import {
  storefrontSupportCaseAdminUpdatePayloadSchema,
  storefrontSupportCaseCreatePayloadSchema,
  storefrontSupportCaseListResponseSchema,
  storefrontSupportCaseResponseSchema,
  storefrontSupportCaseSchema,
  storefrontSupportCaseViewSchema,
  storefrontSupportQueueReportSchema,
  storefrontOrderRequestSchema,
} from "../../shared/index.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

import { ecommerceTableNames } from "../../database/table-names.js"
import { resolveAuthenticatedCustomerAccount } from "./customer-service.js"
import { readStorefrontOrders } from "./storefront-order-storage.js"

function orderBelongsToCustomerAccount(order: StorefrontOrder, account: CustomerAccount) {
  if (order.customerAccountId === account.id) {
    return true
  }

  const accountEmail = account.email.trim().toLowerCase()
  const shippingEmail = order.shippingAddress.email.trim().toLowerCase()

  return order.coreContactId === account.coreContactId || shippingEmail === accountEmail
}

export async function readStorefrontSupportCases(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<StorefrontSupportCase>(
    database,
    ecommerceTableNames.supportCases
  )

  return items.map((item) => storefrontSupportCaseSchema.parse(item))
}

async function readStorefrontOrderRequests(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<StorefrontOrderRequest>(
    database,
    ecommerceTableNames.orderRequests
  )

  return items.map((item) => storefrontOrderRequestSchema.parse(item))
}

async function writeStorefrontSupportCases(
  database: Kysely<unknown>,
  items: StorefrontSupportCase[]
) {
  await replaceJsonStoreRecords(
    database,
    ecommerceTableNames.supportCases,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "storefront-support-case",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

function createSupportCaseNumber(existingItems: StorefrontSupportCase[]) {
  return `SUP-${String(existingItems.length + 1).padStart(4, "0")}`
}

function buildSupportCaseView(
  item: StorefrontSupportCase,
  orderLookup: Map<string, StorefrontOrder>,
  requestLookup: Map<string, StorefrontOrderRequest>
) {
  const linkedOrder = item.orderId ? orderLookup.get(item.orderId) ?? null : null
  const linkedRequest = item.orderRequestId ? requestLookup.get(item.orderRequestId) ?? null : null

  return storefrontSupportCaseViewSchema.parse({
    ...item,
    orderStatus: linkedOrder?.status ?? null,
    orderRequestStatus: linkedRequest?.status ?? null,
    paymentStatus: linkedOrder?.paymentStatus ?? null,
    orderTotalAmount: linkedOrder?.totalAmount ?? null,
    currency: linkedOrder?.currency ?? null,
  })
}

function sortSupportCases(items: StorefrontSupportCase[]) {
  return [...items].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt) || right.createdAt.localeCompare(left.createdAt)
  )
}

export async function listCustomerSupportCases(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string
) {
  const [account, items, orders, requests] = await Promise.all([
    resolveAuthenticatedCustomerAccount(database, config, token),
    readStorefrontSupportCases(database),
    readStorefrontOrders(database),
    readStorefrontOrderRequests(database),
  ])
  const orderLookup = new Map(orders.map((order) => [order.id, order]))
  const requestLookup = new Map(requests.map((request) => [request.id, request]))

  return storefrontSupportCaseListResponseSchema.parse({
    items: sortSupportCases(
      items.filter((item) => item.customerAccountId === account.id)
    ).map((item) => buildSupportCaseView(item, orderLookup, requestLookup)),
  })
}

export async function createCustomerSupportCase(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  payload: unknown
) {
  const parsed = storefrontSupportCaseCreatePayloadSchema.parse(payload) satisfies StorefrontSupportCaseCreatePayload
  const [account, items, orders] = await Promise.all([
    resolveAuthenticatedCustomerAccount(database, config, token),
    readStorefrontSupportCases(database),
    readStorefrontOrders(database),
  ])
  const linkedOrder =
    parsed.orderId != null
      ? orders.find((item) => item.id === parsed.orderId) ?? null
      : null

  if (parsed.orderId && !linkedOrder) {
    throw new ApplicationError("The selected order could not be found.", {}, 404)
  }

  if (linkedOrder && !orderBelongsToCustomerAccount(linkedOrder, account)) {
    throw new ApplicationError(
      "Support requests can only be linked to your own orders.",
      {},
      403
    )
  }

  const now = new Date().toISOString()
  const nextItem = storefrontSupportCaseSchema.parse({
    id: `storefront-support-case:${randomUUID()}`,
    caseNumber: createSupportCaseNumber(items),
    customerAccountId: account.id,
    coreContactId: account.coreContactId,
    orderId: linkedOrder?.id ?? null,
    orderNumber: linkedOrder?.orderNumber ?? null,
    orderRequestId: null,
    status: "open",
    priority: parsed.priority,
    category: parsed.category,
    assignedTeam:
      parsed.category === "refund" ? "finance" : parsed.category === "shipment" ? "operations" : "support",
    subject: parsed.subject,
    message: parsed.message,
    adminNote: null,
    resolutionCode: null,
    firstResponseDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    customerName: account.displayName,
    customerEmail: account.email,
    customerPhone: account.phoneNumber,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  })

  const nextItems = sortSupportCases([nextItem, ...items])
  await writeStorefrontSupportCases(database, nextItems)

  return storefrontSupportCaseResponseSchema.parse({
    item: buildSupportCaseView(
      nextItem,
      new Map(orders.map((order) => [order.id, order])),
      new Map()
    ),
  })
}

export async function createLinkedSupportCaseForOrderRequest(
  database: Kysely<unknown>,
  input: {
    order: StorefrontOrder
    request: Pick<
      StorefrontOrderRequest,
      "id" | "type" | "reason" | "customerAccountId" | "coreContactId" | "customerName" | "customerEmail" | "customerPhone"
    >
  }
) {
  const items = await readStorefrontSupportCases(database)
  const existing = items.find((item) => item.orderRequestId === input.request.id)

  if (existing) {
    return existing
  }

  const now = new Date().toISOString()
  const created = storefrontSupportCaseSchema.parse({
    id: `storefront-support-case:${randomUUID()}`,
    caseNumber: createSupportCaseNumber(items),
    customerAccountId: input.request.customerAccountId,
    coreContactId: input.request.coreContactId,
    orderId: input.order.id,
    orderNumber: input.order.orderNumber,
    orderRequestId: input.request.id,
    status: "open",
    priority: input.request.type === "return" ? "high" : "normal",
    category: input.request.type === "return" ? "refund" : "order",
    assignedTeam: input.request.type === "return" ? "operations" : "support",
    subject:
      input.request.type === "return"
        ? `RMA review required for ${input.order.orderNumber}`
        : `Cancellation review required for ${input.order.orderNumber}`,
    message: input.request.reason,
    adminNote: null,
    resolutionCode: null,
    firstResponseDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    customerName: input.request.customerName,
    customerEmail: input.request.customerEmail,
    customerPhone: input.request.customerPhone,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  })

  await writeStorefrontSupportCases(database, sortSupportCases([created, ...items]))
  return created
}

export async function getStorefrontSupportQueueReport(database: Kysely<unknown>) {
  const [items, orders, requests] = await Promise.all([
    readStorefrontSupportCases(database),
    readStorefrontOrders(database),
    readStorefrontOrderRequests(database),
  ])
  const orderLookup = new Map(orders.map((order) => [order.id, order]))
  const requestLookup = new Map(requests.map((request) => [request.id, request]))
  const sortedItems = sortSupportCases(items)

  return storefrontSupportQueueReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      totalCases: sortedItems.length,
      openCount: sortedItems.filter((item) => item.status === "open").length,
      inProgressCount: sortedItems.filter((item) => item.status === "in_progress").length,
      waitingCustomerCount: sortedItems.filter((item) => item.status === "waiting_customer").length,
      resolvedCount: sortedItems.filter((item) => ["resolved", "closed"].includes(item.status)).length,
      urgentCount: sortedItems.filter((item) => item.priority === "urgent").length,
      rmaLinkedCount: sortedItems.filter((item) => Boolean(item.orderRequestId)).length,
      financeOwnedCount: sortedItems.filter((item) => item.assignedTeam === "finance").length,
    },
    items: sortedItems.map((item) => buildSupportCaseView(item, orderLookup, requestLookup)),
  })
}

export async function updateStorefrontSupportCase(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsed = storefrontSupportCaseAdminUpdatePayloadSchema.parse(payload) satisfies StorefrontSupportCaseAdminUpdatePayload
  const [items, orders, requests] = await Promise.all([
    readStorefrontSupportCases(database),
    readStorefrontOrders(database),
    readStorefrontOrderRequests(database),
  ])
  const existing = items.find((item) => item.id === parsed.caseId) ?? null

  if (!existing) {
    throw new ApplicationError("Support case could not be found.", {}, 404)
  }

  const now = new Date().toISOString()
  const nextItem = storefrontSupportCaseSchema.parse({
    ...existing,
    status: parsed.status,
    priority: parsed.priority ?? existing.priority,
    assignedTeam: parsed.assignedTeam ?? existing.assignedTeam,
    adminNote: parsed.adminNote ?? existing.adminNote,
    resolutionCode:
      parsed.status === "resolved" || parsed.status === "closed"
        ? parsed.resolutionCode ?? existing.resolutionCode
        : existing.resolutionCode,
    resolvedAt:
      parsed.status === "resolved" || parsed.status === "closed"
        ? existing.resolvedAt ?? now
        : null,
    updatedAt: now,
  })

  const nextItems = sortSupportCases(
    items.map((item) => (item.id === existing.id ? nextItem : item))
  )

  await writeStorefrontSupportCases(database, nextItems)

  return storefrontSupportCaseResponseSchema.parse({
    item: buildSupportCaseView(
      nextItem,
      new Map(orders.map((order) => [order.id, order])),
      new Map(requests.map((request) => [request.id, request]))
    ),
  })
}
