import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import {
  attachStorefrontOrderErpDeliveryNoteLink,
  attachStorefrontOrderErpInvoiceLink,
  attachStorefrontOrderErpReturnLink,
  attachStorefrontOrderErpSalesOrderLink,
  getStorefrontOrderForConnector,
} from "../../../ecommerce/src/services/order-service.js"
import { readStorefrontOrders } from "../../../ecommerce/src/services/storefront-order-storage.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappeDeliveryNoteSyncPayloadSchema,
  frappeDeliveryNoteSyncRecordSchema,
  frappeDeliveryNoteSyncResponseSchema,
  frappeInvoiceSyncPayloadSchema,
  frappeInvoiceSyncRecordSchema,
  frappeInvoiceSyncResponseSchema,
  frappeReturnSyncPayloadSchema,
  frappeReturnSyncRecordSchema,
  frappeReturnSyncResponseSchema,
  frappeTransactionReconciliationQueueResponseSchema,
  frappeTransactionReplayPayloadSchema,
  frappeTransactionReplayResponseSchema,
  type FrappeDeliveryNoteSyncRecord,
  type FrappeInvoiceSyncRecord,
  type FrappeReturnSyncRecord,
  type FrappeTransactionReconciliationQueueItem,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import { assertFrappeViewer, assertSuperAdmin } from "./access.js"
import { recordFrappeConnectorEvent } from "./observability-service.js"
import { pushStorefrontOrderToFrappeSalesOrder } from "./sales-order-service.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

async function readDeliveryNoteSyncs(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    frappeTableNames.deliveryNoteSyncs,
    frappeDeliveryNoteSyncRecordSchema
  )

  return items.sort((left, right) => right.lastAttemptedAt.localeCompare(left.lastAttemptedAt))
}

async function writeDeliveryNoteSyncs(
  database: Kysely<unknown>,
  records: FrappeDeliveryNoteSyncRecord[]
) {
  await replaceStorePayloads(
    database,
    frappeTableNames.deliveryNoteSyncs,
    records.map((record, index) => ({
      id: record.id,
      moduleKey: "delivery-note-sync",
      sortOrder: index + 1,
      payload: record,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }))
  )
}

async function readInvoiceSyncs(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    frappeTableNames.invoiceSyncs,
    frappeInvoiceSyncRecordSchema
  )

  return items.sort((left, right) => right.lastAttemptedAt.localeCompare(left.lastAttemptedAt))
}

async function writeInvoiceSyncs(database: Kysely<unknown>, records: FrappeInvoiceSyncRecord[]) {
  await replaceStorePayloads(
    database,
    frappeTableNames.invoiceSyncs,
    records.map((record, index) => ({
      id: record.id,
      moduleKey: "invoice-sync",
      sortOrder: index + 1,
      payload: record,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }))
  )
}

async function readReturnSyncs(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    frappeTableNames.returnSyncs,
    frappeReturnSyncRecordSchema
  )

  return items.sort((left, right) => right.lastAttemptedAt.localeCompare(left.lastAttemptedAt))
}

async function writeReturnSyncs(database: Kysely<unknown>, records: FrappeReturnSyncRecord[]) {
  await replaceStorePayloads(
    database,
    frappeTableNames.returnSyncs,
    records.map((record, index) => ({
      id: record.id,
      moduleKey: "return-sync",
      sortOrder: index + 1,
      payload: record,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }))
  )
}

function buildQueueItem(
  input: Omit<FrappeTransactionReconciliationQueueItem, "id"> & { id?: string }
) {
  return {
    id: input.id ?? `frappe-transaction-queue:${randomUUID()}`,
    ...input,
  }
}

export async function syncFrappeDeliveryNoteToEcommerce(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsed = frappeDeliveryNoteSyncPayloadSchema.parse(payload)
  const order = await getStorefrontOrderForConnector(database, parsed.storefrontOrderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId: parsed.storefrontOrderId }, 404)
  }

  const existing = (await readDeliveryNoteSyncs(database)).find(
    (item) => item.storefrontOrderId === parsed.storefrontOrderId
  )
  const attemptedAt = new Date().toISOString()
  const record = frappeDeliveryNoteSyncRecordSchema.parse({
    id: existing?.id ?? `frappe-delivery-sync:${randomUUID()}`,
    storefrontOrderId: order.id,
    storefrontOrderNumber: order.orderNumber,
    source: "erp_delivery_note",
    status: parsed.status,
    deliveryNoteId: parsed.deliveryNoteId,
    deliveryNoteName: parsed.deliveryNoteName,
    shipmentReference: parsed.shipmentReference,
    carrierName: parsed.carrierName,
    trackingId: parsed.trackingId,
    trackingUrl: parsed.trackingUrl,
    deliveryStatus: parsed.deliveryStatus,
    note: parsed.note,
    lastAttemptedAt: attemptedAt,
    syncedAt: parsed.status === "synced" ? attemptedAt : null,
    failureMessage: parsed.status === "failed" ? parsed.failureMessage : null,
    createdAt: existing?.createdAt ?? attemptedAt,
    updatedAt: attemptedAt,
  })

  const records = await readDeliveryNoteSyncs(database)
  await writeDeliveryNoteSyncs(database, [record, ...records.filter((item) => item.id !== record.id)])
  await attachStorefrontOrderErpDeliveryNoteLink(database, order.id, record)
  await recordFrappeConnectorEvent(database, user, {
    action: "delivery_notes.sync_back",
    status: parsed.status === "synced" ? "success" : "failure",
    message:
      parsed.status === "synced"
        ? `Delivery note sync updated ecommerce order ${order.orderNumber}.`
        : `Delivery note sync failed for ecommerce order ${order.orderNumber}.`,
    referenceId: order.id,
    details: {
      deliveryNoteName: record.deliveryNoteName,
      deliveryStatus: record.deliveryStatus,
    },
  })

  return frappeDeliveryNoteSyncResponseSchema.parse({ sync: record })
}

export async function syncFrappeInvoiceToEcommerce(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsed = frappeInvoiceSyncPayloadSchema.parse(payload)
  const order = await getStorefrontOrderForConnector(database, parsed.storefrontOrderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId: parsed.storefrontOrderId }, 404)
  }

  const existing = (await readInvoiceSyncs(database)).find(
    (item) => item.storefrontOrderId === parsed.storefrontOrderId
  )
  const attemptedAt = new Date().toISOString()
  const record = frappeInvoiceSyncRecordSchema.parse({
    id: existing?.id ?? `frappe-invoice-sync:${randomUUID()}`,
    storefrontOrderId: order.id,
    storefrontOrderNumber: order.orderNumber,
    source: "erp_invoice",
    status: parsed.status,
    invoiceId: parsed.invoiceId,
    invoiceName: parsed.invoiceName,
    invoiceNumber: parsed.invoiceNumber,
    invoiceStatus: parsed.invoiceStatus,
    lastAttemptedAt: attemptedAt,
    syncedAt: parsed.status === "synced" ? attemptedAt : null,
    failureMessage: parsed.status === "failed" ? parsed.failureMessage : null,
    createdAt: existing?.createdAt ?? attemptedAt,
    updatedAt: attemptedAt,
  })

  const records = await readInvoiceSyncs(database)
  await writeInvoiceSyncs(database, [record, ...records.filter((item) => item.id !== record.id)])
  await attachStorefrontOrderErpInvoiceLink(database, order.id, record)
  await recordFrappeConnectorEvent(database, user, {
    action: "invoices.sync_back",
    status: parsed.status === "synced" ? "success" : "failure",
    message:
      parsed.status === "synced"
        ? `Invoice sync updated ecommerce order ${order.orderNumber}.`
        : `Invoice sync failed for ecommerce order ${order.orderNumber}.`,
    referenceId: order.id,
    details: {
      invoiceName: record.invoiceName,
      invoiceNumber: record.invoiceNumber,
    },
  })

  return frappeInvoiceSyncResponseSchema.parse({ sync: record })
}

export async function syncFrappeReturnToEcommerce(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsed = frappeReturnSyncPayloadSchema.parse(payload)
  const order = await getStorefrontOrderForConnector(database, parsed.storefrontOrderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId: parsed.storefrontOrderId }, 404)
  }

  const existing = (await readReturnSyncs(database)).find(
    (item) => item.storefrontOrderId === parsed.storefrontOrderId
  )
  const attemptedAt = new Date().toISOString()
  const record = frappeReturnSyncRecordSchema.parse({
    id: existing?.id ?? `frappe-return-sync:${randomUUID()}`,
    storefrontOrderId: order.id,
    storefrontOrderNumber: order.orderNumber,
    source: "erp_return",
    status: parsed.status,
    returnId: parsed.returnId,
    returnName: parsed.returnName,
    creditNoteId: parsed.creditNoteId,
    creditNoteName: parsed.creditNoteName,
    returnStatus: parsed.returnStatus,
    refundStatus: parsed.refundStatus,
    refundAmount: parsed.refundAmount,
    currency: parsed.currency,
    reason: parsed.reason,
    providerRefundId: parsed.providerRefundId,
    lastAttemptedAt: attemptedAt,
    syncedAt: parsed.status === "synced" ? attemptedAt : null,
    failureMessage: parsed.status === "failed" ? parsed.failureMessage : null,
    createdAt: existing?.createdAt ?? attemptedAt,
    updatedAt: attemptedAt,
  })

  const records = await readReturnSyncs(database)
  await writeReturnSyncs(database, [record, ...records.filter((item) => item.id !== record.id)])
  await attachStorefrontOrderErpReturnLink(database, order.id, record)
  await recordFrappeConnectorEvent(database, user, {
    action: "returns.sync_back",
    status: parsed.status === "synced" ? "success" : "failure",
    message:
      parsed.status === "synced"
        ? `Return sync updated ecommerce order ${order.orderNumber}.`
        : `Return sync failed for ecommerce order ${order.orderNumber}.`,
    referenceId: order.id,
    details: {
      returnName: record.returnName,
      refundStatus: record.refundStatus,
    },
  })

  return frappeReturnSyncResponseSchema.parse({ sync: record })
}

export async function readFrappeTransactionReconciliationQueue(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertFrappeViewer(user)

  const [ordersList, deliverySyncs, invoiceSyncs, returnSyncs] = await Promise.all([
    readStorefrontOrders(database),
    readDeliveryNoteSyncs(database),
    readInvoiceSyncs(database),
    readReturnSyncs(database),
  ])

  const items: FrappeTransactionReconciliationQueueItem[] = []

  for (const order of ordersList) {
    if (
      (order.paymentStatus === "paid" || order.paymentStatus === "refunded") &&
      (!order.erpSalesOrderLink || order.erpSalesOrderLink.status === "failed")
    ) {
      items.push(
        buildQueueItem({
          queueType: "sales_order",
          status: order.erpSalesOrderLink?.status === "failed" ? "sync_failed" : "pending_sync",
          storefrontOrderId: order.id,
          storefrontOrderNumber: order.orderNumber,
          severity: order.erpSalesOrderLink?.status === "failed" ? "error" : "warn",
          summary:
            order.erpSalesOrderLink?.failureMessage ??
            "Paid ecommerce order is missing an ERP Sales Order link.",
          erpReference: order.erpSalesOrderLink?.salesOrderName ?? null,
          lastAttemptedAt: order.erpSalesOrderLink?.lastAttemptedAt ?? null,
          replayAvailable: true,
        })
      )
    }

    if (
      (order.status === "shipped" || order.status === "delivered") &&
      (!order.erpDeliveryNoteLink || order.erpDeliveryNoteLink.status === "failed")
    ) {
      const latest = deliverySyncs.find((item) => item.storefrontOrderId === order.id)
      items.push(
        buildQueueItem({
          queueType: "delivery_note",
          status: order.erpDeliveryNoteLink?.status === "failed" ? "sync_failed" : "pending_sync",
          storefrontOrderId: order.id,
          storefrontOrderNumber: order.orderNumber,
          severity: order.erpDeliveryNoteLink?.status === "failed" ? "error" : "warn",
          summary:
            order.erpDeliveryNoteLink?.failureMessage ??
            "Shipment or delivery status is present in ecommerce without an ERP delivery-note link.",
          erpReference: latest?.deliveryNoteName ?? order.erpDeliveryNoteLink?.deliveryNoteName ?? null,
          lastAttemptedAt: latest?.lastAttemptedAt ?? order.erpDeliveryNoteLink?.lastAttemptedAt ?? null,
          replayAvailable: Boolean(latest),
        })
      )
    }

    if (
      (order.paymentStatus === "paid" || order.paymentStatus === "refunded") &&
      (!order.erpInvoiceLink || order.erpInvoiceLink.status === "failed")
    ) {
      const latest = invoiceSyncs.find((item) => item.storefrontOrderId === order.id)
      items.push(
        buildQueueItem({
          queueType: "invoice",
          status: order.erpInvoiceLink?.status === "failed" ? "sync_failed" : "pending_sync",
          storefrontOrderId: order.id,
          storefrontOrderNumber: order.orderNumber,
          severity: order.erpInvoiceLink?.status === "failed" ? "error" : "warn",
          summary:
            order.erpInvoiceLink?.failureMessage ??
            "Financially active ecommerce order is missing an ERP invoice link.",
          erpReference: latest?.invoiceName ?? order.erpInvoiceLink?.invoiceName ?? null,
          lastAttemptedAt: latest?.lastAttemptedAt ?? order.erpInvoiceLink?.lastAttemptedAt ?? null,
          replayAvailable: Boolean(latest),
        })
      )
    }

    if (
      order.refund &&
      order.refund.status !== "none" &&
      (!order.erpReturnLink || order.erpReturnLink.status === "failed")
    ) {
      const latest = returnSyncs.find((item) => item.storefrontOrderId === order.id)
      items.push(
        buildQueueItem({
          queueType: "return_refund",
          status: order.erpReturnLink?.status === "failed" ? "sync_failed" : "pending_sync",
          storefrontOrderId: order.id,
          storefrontOrderNumber: order.orderNumber,
          severity: order.erpReturnLink?.status === "failed" ? "error" : "warn",
          summary:
            order.erpReturnLink?.failureMessage ??
            "Refund or return workflow is active without an ERP return link.",
          erpReference: latest?.returnName ?? order.erpReturnLink?.returnName ?? null,
          lastAttemptedAt: latest?.lastAttemptedAt ?? order.erpReturnLink?.lastAttemptedAt ?? null,
          replayAvailable: Boolean(latest),
        })
      )
    }
  }

  return frappeTransactionReconciliationQueueResponseSchema.parse({
    generatedAt: new Date().toISOString(),
    items,
  })
}

export async function replayFrappeTransactionSync(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsed = frappeTransactionReplayPayloadSchema.parse(payload)
  const order = await getStorefrontOrderForConnector(database, parsed.storefrontOrderId)

  if (!order) {
    throw new ApplicationError("Storefront order could not be found.", { orderId: parsed.storefrontOrderId }, 404)
  }

  if (parsed.queueType === "sales_order") {
    const syncRecord = await pushStorefrontOrderToFrappeSalesOrder(database, order, {
      source: "manual_replay",
    })
    await attachStorefrontOrderErpSalesOrderLink(database, order.id, syncRecord)

    return frappeTransactionReplayResponseSchema.parse({
      replayed: true,
      queueType: parsed.queueType,
      storefrontOrderId: order.id,
      summary: "Replayed Sales Order push for the ecommerce order.",
    })
  }

  if (parsed.queueType === "delivery_note") {
    const record = (await readDeliveryNoteSyncs(database)).find(
      (item) => item.storefrontOrderId === order.id
    )

    if (!record) {
      throw new ApplicationError("No delivery-note sync record is available for replay.", { orderId: order.id }, 404)
    }

    await attachStorefrontOrderErpDeliveryNoteLink(database, order.id, record)

    return frappeTransactionReplayResponseSchema.parse({
      replayed: true,
      queueType: parsed.queueType,
      storefrontOrderId: order.id,
      summary: "Replayed delivery-note sync into ecommerce.",
    })
  }

  if (parsed.queueType === "invoice") {
    const record = (await readInvoiceSyncs(database)).find(
      (item) => item.storefrontOrderId === order.id
    )

    if (!record) {
      throw new ApplicationError("No invoice sync record is available for replay.", { orderId: order.id }, 404)
    }

    await attachStorefrontOrderErpInvoiceLink(database, order.id, record)

    return frappeTransactionReplayResponseSchema.parse({
      replayed: true,
      queueType: parsed.queueType,
      storefrontOrderId: order.id,
      summary: "Replayed invoice sync into ecommerce.",
    })
  }

  const record = (await readReturnSyncs(database)).find(
    (item) => item.storefrontOrderId === order.id
  )

  if (!record) {
    throw new ApplicationError("No return sync record is available for replay.", { orderId: order.id }, 404)
  }

  await attachStorefrontOrderErpReturnLink(database, order.id, record)

  return frappeTransactionReplayResponseSchema.parse({
    replayed: true,
    queueType: parsed.queueType,
    storefrontOrderId: order.id,
    summary: "Replayed return or refund sync into ecommerce.",
  })
}
