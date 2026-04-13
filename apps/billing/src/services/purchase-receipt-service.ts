import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingPurchaseReceiptListResponseSchema,
  billingPurchaseReceiptResponseSchema,
  billingPurchaseReceiptSchema,
  billingPurchaseReceiptUpsertPayloadSchema,
  type BillingPurchaseReceipt,
} from "../../shared/index.js"
import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import { getStorePayloadById, listStorePayloads, replaceStorePayloads } from "./store.js"

async function readPurchaseReceipts(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    billingTableNames.purchaseReceipts,
    billingPurchaseReceiptSchema
  )

  return items.sort(
    (left, right) =>
      right.postingDate.localeCompare(left.postingDate) ||
      right.updatedAt.localeCompare(left.updatedAt)
  )
}

function buildPurchaseReceiptRecord(
  payload: unknown,
  existing: BillingPurchaseReceipt | undefined,
  userId: string | null
) {
  const parsedPayload = billingPurchaseReceiptUpsertPayloadSchema.parse(payload)
  const timestamp = new Date().toISOString()
  const lines = parsedPayload.lines.map((line, index) =>
    billingPurchaseReceiptSchema.shape.lines.element.parse({
      id: existing?.lines[index]?.id ?? `purchase-receipt-line:${randomUUID()}`,
      productId: line.productId,
      productName: line.productName,
      variantId: line.variantId,
      variantName: line.variantName,
      warehouseId: line.warehouseId,
      quantity: line.quantity,
      receivedQuantity: existing?.lines[index]?.receivedQuantity ?? 0,
      unit: line.unit,
      unitCost: line.unitCost,
      note: line.note,
    })
  )

  return billingPurchaseReceiptSchema.parse({
    id: existing?.id ?? `purchase-receipt:${randomUUID()}`,
    receiptNumber: parsedPayload.receiptNumber,
    supplierName: parsedPayload.supplierName,
    supplierLedgerId: parsedPayload.supplierLedgerId,
    postingDate: parsedPayload.postingDate,
    warehouseId: parsedPayload.warehouseId,
    warehouseName: parsedPayload.warehouseName,
    sourceVoucherId: parsedPayload.sourceVoucherId,
    sourceFrappeReceiptId: parsedPayload.sourceFrappeReceiptId,
    status: parsedPayload.status,
    lines,
    note: parsedPayload.note,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    createdByUserId: existing?.createdByUserId ?? userId,
  })
}

export async function listBillingPurchaseReceipts(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)

  return billingPurchaseReceiptListResponseSchema.parse({
    items: await readPurchaseReceipts(database),
  })
}

export async function getBillingPurchaseReceipt(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string
) {
  assertBillingViewer(user)

  const item = await getStorePayloadById(
    database,
    billingTableNames.purchaseReceipts,
    receiptId,
    billingPurchaseReceiptSchema
  )

  if (!item) {
    throw new ApplicationError("Billing purchase receipt could not be found.", { receiptId }, 404)
  }

  return billingPurchaseReceiptResponseSchema.parse({ item })
}

export async function createBillingPurchaseReceipt(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const items = await readPurchaseReceipts(database)
  const createdItem = buildPurchaseReceiptRecord(payload, undefined, user.id)
  const nextItems = [createdItem, ...items]

  await replaceStorePayloads(
    database,
    billingTableNames.purchaseReceipts,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "purchase-receipts",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  return billingPurchaseReceiptResponseSchema.parse({
    item: createdItem,
  })
}

export async function updateBillingPurchaseReceipt(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const items = await readPurchaseReceipts(database)
  const existingItem = items.find((item) => item.id === receiptId)

  if (!existingItem) {
    throw new ApplicationError("Billing purchase receipt could not be found.", { receiptId }, 404)
  }

  const updatedItem = buildPurchaseReceiptRecord(payload, existingItem, existingItem.createdByUserId)
  const nextItems = items.map((item) => (item.id === receiptId ? updatedItem : item))

  await replaceStorePayloads(
    database,
    billingTableNames.purchaseReceipts,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "purchase-receipts",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  return billingPurchaseReceiptResponseSchema.parse({
    item: updatedItem,
  })
}
