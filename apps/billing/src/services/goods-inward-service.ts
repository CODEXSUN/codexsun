import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingGoodsInwardListResponseSchema,
  billingGoodsInwardResponseSchema,
  billingGoodsInwardSchema,
  billingGoodsInwardUpsertPayloadSchema,
  billingPurchaseReceiptSchema,
  type BillingGoodsInward,
} from "../../shared/index.js"
import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import { getStorePayloadById, listStorePayloads, replaceStorePayloads } from "./store.js"

async function readPurchaseReceipts(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.purchaseReceipts,
    billingPurchaseReceiptSchema
  )
}

async function readGoodsInwardNotes(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    billingTableNames.goodsInwardNotes,
    billingGoodsInwardSchema
  )

  return items.sort(
    (left, right) =>
      right.postingDate.localeCompare(left.postingDate) ||
      right.updatedAt.localeCompare(left.updatedAt)
  )
}

function resolveStockPostingStatus(
  status: BillingGoodsInward["status"],
  existing: BillingGoodsInward | undefined
) {
  if (existing?.stockPostingStatus === "posted") {
    return "posted"
  }

  return status === "verified" ? "blocked_until_verification" : "not_posted"
}

async function assertPurchaseReceiptExists(
  database: Kysely<unknown>,
  purchaseReceiptId: string
) {
  const receipts = await readPurchaseReceipts(database)
  const purchaseReceipt = receipts.find((item) => item.id === purchaseReceiptId)

  if (!purchaseReceipt) {
    throw new ApplicationError(
      "Billing goods inward note requires a valid purchase receipt.",
      { purchaseReceiptId },
      404
    )
  }

  return purchaseReceipt
}

async function buildGoodsInwardRecord(
  database: Kysely<unknown>,
  payload: unknown,
  existing: BillingGoodsInward | undefined,
  userId: string | null
) {
  const parsedPayload = billingGoodsInwardUpsertPayloadSchema.parse(payload)
  const purchaseReceipt = await assertPurchaseReceiptExists(database, parsedPayload.purchaseReceiptId)
  const timestamp = new Date().toISOString()
  const lines = parsedPayload.lines.map((line, index) => {
    const damageReceived = line.damageReceived || line.damagedQuantity > 0
    const returnToVendor = line.returnToVendor
    const damageRemark =
      damageReceived || returnToVendor ? line.damageRemark?.trim() || null : null
    const damagedQuantity = damageReceived ? line.damagedQuantity : 0
    const exceptionQuantity = line.rejectedQuantity + damagedQuantity
    const totalProcessedQuantity = line.acceptedQuantity + exceptionQuantity

    if (damageReceived && damagedQuantity <= 0) {
      throw new ApplicationError(
        "Damage received lines must include a damaged quantity.",
        {
          purchaseReceiptLineId: line.purchaseReceiptLineId,
          index,
        },
        409
      )
    }

    if (returnToVendor && exceptionQuantity <= 0) {
      throw new ApplicationError(
        "Return-to-vendor lines must include rejected or damaged quantity.",
        {
          purchaseReceiptLineId: line.purchaseReceiptLineId,
          index,
        },
        409
      )
    }

    if ((damageReceived || returnToVendor) && !damageRemark) {
      throw new ApplicationError(
        "Damage received and vendor return lines require remarks.",
        {
          purchaseReceiptLineId: line.purchaseReceiptLineId,
          index,
        },
        409
      )
    }

    if (totalProcessedQuantity > line.expectedQuantity) {
      throw new ApplicationError(
        "Accepted, rejected, and damaged quantity cannot exceed the expected quantity.",
        {
          purchaseReceiptLineId: line.purchaseReceiptLineId,
          index,
          expectedQuantity: line.expectedQuantity,
          acceptedQuantity: line.acceptedQuantity,
          rejectedQuantity: line.rejectedQuantity,
          damagedQuantity,
        },
        409
      )
    }

    return billingGoodsInwardSchema.shape.lines.element.parse({
      id: existing?.lines[index]?.id ?? `goods-inward-line:${randomUUID()}`,
      purchaseReceiptLineId: line.purchaseReceiptLineId,
      productId: line.productId,
      productName: line.productName,
      variantId: line.variantId,
      variantName: line.variantName,
      expectedQuantity: line.expectedQuantity,
      acceptedQuantity: line.acceptedQuantity,
      rejectedQuantity: line.rejectedQuantity,
      damagedQuantity,
      damageReceived,
      returnToVendor,
      damageRemark,
      manufacturerBarcode: line.manufacturerBarcode,
      manufacturerSerial: line.manufacturerSerial,
      serializationMode: line.serializationMode,
      serializationBatchCode: line.serializationBatchCode,
      serializationSerialPrefix: line.serializationSerialPrefix,
      serializationBarcodePrefix: line.serializationBarcodePrefix,
      serializationManufacturerBarcodePrefix: line.serializationManufacturerBarcodePrefix,
      serializationBarcodeQuantity: line.serializationBarcodeQuantity,
      serializationExpiresAt: line.serializationExpiresAt,
      note: line.note,
    })
  })

  const record = billingGoodsInwardSchema.parse({
    id: existing?.id ?? `goods-inward:${randomUUID()}`,
    inwardNumber: parsedPayload.inwardNumber,
    purchaseReceiptId: parsedPayload.purchaseReceiptId,
    purchaseReceiptNumber: parsedPayload.purchaseReceiptNumber,
    supplierName: parsedPayload.supplierName,
    postingDate: parsedPayload.postingDate,
    warehouseId: parsedPayload.warehouseId,
    warehouseName: parsedPayload.warehouseName,
    status: parsedPayload.status,
    stockPostingStatus: resolveStockPostingStatus(parsedPayload.status, existing),
    lines,
    note: parsedPayload.note,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    createdByUserId: existing?.createdByUserId ?? userId,
    stockUnitIds: existing?.stockUnitIds ?? [],
    postedAt: existing?.postedAt ?? null,
    postedByUserId: existing?.postedByUserId ?? null,
  })

  if (record.purchaseReceiptNumber !== purchaseReceipt.entryNumber) {
    throw new ApplicationError(
      "Goods inward purchase receipt number must match the linked purchase receipt.",
      {
        purchaseReceiptId: record.purchaseReceiptId,
        purchaseReceiptNumber: record.purchaseReceiptNumber,
        expectedReceiptNumber: purchaseReceipt.entryNumber,
      },
      409
    )
  }

  // Guardrail: #184 does not post stock into core yet.
  return record
}

export async function listBillingGoodsInwardNotes(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)

  return billingGoodsInwardListResponseSchema.parse({
    items: await readGoodsInwardNotes(database),
  })
}

export async function getBillingGoodsInwardNote(
  database: Kysely<unknown>,
  user: AuthUser,
  inwardId: string
) {
  assertBillingViewer(user)

  const item = await getStorePayloadById(
    database,
    billingTableNames.goodsInwardNotes,
    inwardId,
    billingGoodsInwardSchema
  )

  if (!item) {
    throw new ApplicationError("Billing goods inward note could not be found.", { inwardId }, 404)
  }

  return billingGoodsInwardResponseSchema.parse({ item })
}

export async function createBillingGoodsInwardNote(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const items = await readGoodsInwardNotes(database)
  const createdItem = await buildGoodsInwardRecord(database, payload, undefined, user.id)
  const nextItems = [createdItem, ...items]

  await replaceStorePayloads(
    database,
    billingTableNames.goodsInwardNotes,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "goods-inward-notes",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  return billingGoodsInwardResponseSchema.parse({
    item: createdItem,
  })
}

export async function updateBillingGoodsInwardNote(
  database: Kysely<unknown>,
  user: AuthUser,
  inwardId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const items = await readGoodsInwardNotes(database)
  const existingItem = items.find((item) => item.id === inwardId)

  if (!existingItem) {
    throw new ApplicationError("Billing goods inward note could not be found.", { inwardId }, 404)
  }

  const updatedItem = await buildGoodsInwardRecord(
    database,
    payload,
    existingItem,
    existingItem.createdByUserId
  )
  const nextItems = items.map((item) => (item.id === inwardId ? updatedItem : item))

  await replaceStorePayloads(
    database,
    billingTableNames.goodsInwardNotes,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "goods-inward-notes",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  return billingGoodsInwardResponseSchema.parse({
    item: updatedItem,
  })
}
