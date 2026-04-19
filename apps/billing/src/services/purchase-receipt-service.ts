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
import { replaceStorePayloads } from "./store.js"

type DynamicDatabase = Record<string, Record<string, unknown>>
type JsonStoreRow = {
  id: string
  payload: string
}

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function asNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function asObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizeLegacyPurchaseReceipt(payload: unknown): BillingPurchaseReceipt {
  const record = asObject(payload)

  if (!record) {
    throw new ApplicationError("Billing purchase receipt payload is invalid.", {}, 400)
  }

  const rawLines = Array.isArray(record.lines) ? record.lines : []
  const lines = rawLines.map((line, index) => {
    const lineRecord = asObject(line) ?? {}
    const quantity =
      asNullableNumber(lineRecord.quantity) ??
      asNullableNumber(lineRecord.receivedQuantity) ??
      0
    const rate =
      asNullableNumber(lineRecord.rate) ??
      asNullableNumber(lineRecord.unitCost) ??
      0
    const amount =
      asNullableNumber(lineRecord.amount) ??
      ((quantity > 0 || rate > 0) ? Number((quantity * rate).toFixed(2)) : null)

    return billingPurchaseReceiptSchema.shape.lines.element.parse({
      id:
        asNonEmptyString(lineRecord.id) ??
        `purchase-receipt-line:${index + 1}:${randomUUID()}`,
      productId:
        asNonEmptyString(lineRecord.productId) ??
        asNonEmptyString(lineRecord.productName) ??
        `legacy-product:${index + 1}`,
      description:
        asNonEmptyString(lineRecord.description) ??
        asNonEmptyString(lineRecord.variantName) ??
        null,
      quantity,
      rate,
      amount,
      notes:
        asNonEmptyString(lineRecord.notes) ??
        asNonEmptyString(lineRecord.note) ??
        "",
    })
  })

  const entryNumber =
    asNonEmptyString(record.entryNumber) ??
    asNonEmptyString(record.registerEntryNumber) ??
    asNonEmptyString(record.receiptNumber) ??
    "01"

  const supplierId =
    asNonEmptyString(record.supplierId) ??
    asNonEmptyString(record.supplierName) ??
    asNonEmptyString(record.supplierLedgerId) ??
    "legacy-supplier"

  const warehouseId =
    asNonEmptyString(record.warehouseId) ??
    asNonEmptyString(record.warehouseName) ??
    "warehouse:default"

  const postingDate =
    asNonEmptyString(record.postingDate) ??
    asNonEmptyString(record.createdAt) ??
    new Date().toISOString().slice(0, 10)

  return billingPurchaseReceiptSchema.parse({
    id:
      asNonEmptyString(record.id) ??
      `purchase-receipt:${randomUUID()}`,
    entryNumber,
    supplierId,
    supplierReferenceNumber: asNonEmptyString(record.supplierReferenceNumber),
    supplierReferenceDate: asNonEmptyString(record.supplierReferenceDate),
    postingDate,
    warehouseId,
    status:
      asNonEmptyString(record.status) ??
      "draft",
    lines: lines.length > 0
      ? lines
      : [
          billingPurchaseReceiptSchema.shape.lines.element.parse({
            id: `purchase-receipt-line:${randomUUID()}`,
            productId: "legacy-product",
            description: null,
            quantity: 0,
            rate: 0,
            amount: 0,
            notes: "",
          }),
        ],
    createdAt:
      asNonEmptyString(record.createdAt) ??
      new Date().toISOString(),
    updatedAt:
      asNonEmptyString(record.updatedAt) ??
      asNonEmptyString(record.createdAt) ??
      new Date().toISOString(),
    createdByUserId: asNonEmptyString(record.createdByUserId),
  })
}

async function readPurchaseReceipts(database: Kysely<unknown>) {
  const rows = (await asQueryDatabase(database)
    .selectFrom(billingTableNames.purchaseReceipts)
    .select(["id", "payload"])
    .orderBy("sort_order")
    .orderBy("id")
    .execute()) as JsonStoreRow[]

  const items = rows.map((row) => normalizeLegacyPurchaseReceipt(JSON.parse(row.payload)))

  return items.sort(
    (left, right) =>
      right.postingDate.localeCompare(left.postingDate) ||
      right.updatedAt.localeCompare(left.updatedAt)
  )
}

const purchaseReceiptEntryPattern = /^(\d+)$/

function getNextPurchaseReceiptEntryNumber(
  items: BillingPurchaseReceipt[],
  existingReceiptId?: string
) {
  const maxSequence = items.reduce((currentMax, item) => {
    if (existingReceiptId && item.id === existingReceiptId) {
      return currentMax
    }

    const normalizedValue = item.entryNumber?.trim()
    if (!normalizedValue) {
      return currentMax
    }

    const match = purchaseReceiptEntryPattern.exec(normalizedValue)
    if (!match) {
      return currentMax
    }

    const sequence = Number(match[1])
    return Number.isFinite(sequence) ? Math.max(currentMax, sequence) : currentMax
  }, 0)

  return String(maxSequence + 1).padStart(2, "0")
}

function resolvePurchaseReceiptEntryNumber(
  items: BillingPurchaseReceipt[],
  parsedPayload: ReturnType<typeof billingPurchaseReceiptUpsertPayloadSchema.parse>,
  existing: BillingPurchaseReceipt | undefined
) {
  const requestedNumber = parsedPayload.entryNumber?.trim() || null
  const nextNumber =
    requestedNumber ??
    existing?.entryNumber?.trim() ??
    getNextPurchaseReceiptEntryNumber(items, existing?.id)

  const duplicate = items.find(
    (item) =>
      item.id !== existing?.id &&
      item.entryNumber?.trim().toLowerCase() === nextNumber.toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError(
      "Billing purchase receipt register entry number already exists.",
      { entryNumber: nextNumber },
      400
    )
  }

  return nextNumber
}

function buildPurchaseReceiptRecord(
  items: BillingPurchaseReceipt[],
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
      quantity: line.quantity,
      description: line.description,
      rate: line.rate,
      amount:
        line.amount ??
        ((line.quantity ?? 0) > 0 || (line.rate ?? 0) > 0
          ? Number(((line.quantity ?? 0) * (line.rate ?? 0)).toFixed(2))
          : null),
      notes: line.notes,
    })
  )

  return billingPurchaseReceiptSchema.parse({
    id: existing?.id ?? `purchase-receipt:${randomUUID()}`,
    entryNumber: resolvePurchaseReceiptEntryNumber(
      items,
      parsedPayload,
      existing
    ),
    supplierId: parsedPayload.supplierId,
    supplierReferenceNumber: parsedPayload.supplierReferenceNumber,
    supplierReferenceDate: parsedPayload.supplierReferenceDate,
    postingDate: parsedPayload.postingDate,
    warehouseId: parsedPayload.warehouseId,
    status: parsedPayload.status,
    lines,
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

  const item = (await readPurchaseReceipts(database)).find((receipt) => receipt.id === receiptId)

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
  const createdItem = buildPurchaseReceiptRecord(items, payload, undefined, user.id)
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

  const updatedItem = buildPurchaseReceiptRecord(
    items,
    payload,
    existingItem,
    existingItem.createdByUserId
  )
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

export async function deleteBillingPurchaseReceipt(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string
) {
  assertBillingViewer(user)

  const items = await readPurchaseReceipts(database)
  const existingItem = items.find((item) => item.id === receiptId)

  if (!existingItem) {
    throw new ApplicationError("Billing purchase receipt could not be found.", { receiptId }, 404)
  }

  const nextItems = items.filter((item) => item.id !== receiptId)

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

  return {
    deleted: true as const,
    id: receiptId,
  }
}
