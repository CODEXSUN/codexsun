import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingDeliveryNoteListResponseSchema,
  billingDeliveryNoteResponseSchema,
  billingDeliveryNoteSchema,
  billingDeliveryNoteUpsertPayloadSchema,
  type BillingDeliveryNote,
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

function normalizeDeliveryNote(payload: unknown): BillingDeliveryNote {
  return billingDeliveryNoteSchema.parse(payload)
}

async function readDeliveryNotes(database: Kysely<unknown>) {
  const rows = (await asQueryDatabase(database)
    .selectFrom(billingTableNames.deliveryNotes)
    .select(["id", "payload"])
    .orderBy("sort_order")
    .orderBy("id")
    .execute()) as JsonStoreRow[]

  const items = rows.map((row) => normalizeDeliveryNote(JSON.parse(row.payload)))

  return items.sort(
    (left, right) =>
      right.postingDate.localeCompare(left.postingDate) ||
      right.updatedAt.localeCompare(left.updatedAt)
  )
}

const deliveryNoteNumberPattern = /^(\d+)$/

function getNextDeliveryNoteNumber(items: BillingDeliveryNote[], existingNoteId?: string) {
  const maxSequence = items.reduce((currentMax, item) => {
    if (existingNoteId && item.id === existingNoteId) {
      return currentMax
    }

    const normalizedValue = item.deliveryNoteNumber.trim()
    const match = deliveryNoteNumberPattern.exec(normalizedValue)
    if (!match) {
      return currentMax
    }

    const sequence = Number(match[1])
    return Number.isFinite(sequence) ? Math.max(currentMax, sequence) : currentMax
  }, 0)

  return String(maxSequence + 1).padStart(2, "0")
}

function resolveDeliveryNoteNumber(
  items: BillingDeliveryNote[],
  requestedNumber: string,
  existing: BillingDeliveryNote | undefined
) {
  const nextNumber =
    requestedNumber.trim() ||
    existing?.deliveryNoteNumber.trim() ||
    getNextDeliveryNoteNumber(items, existing?.id)

  const duplicate = items.find(
    (item) =>
      item.id !== existing?.id &&
      item.deliveryNoteNumber.trim().toLowerCase() === nextNumber.toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError(
      "Delivery note number already exists.",
      { deliveryNoteNumber: nextNumber },
      400
    )
  }

  return nextNumber
}

function buildDeliveryNoteRecord(
  items: BillingDeliveryNote[],
  payload: unknown,
  existing: BillingDeliveryNote | undefined,
  userId: string | null
) {
  const parsedPayload = billingDeliveryNoteUpsertPayloadSchema.parse(payload)
  const timestamp = new Date().toISOString()

  return billingDeliveryNoteSchema.parse({
    id: existing?.id ?? `delivery-note:${randomUUID()}`,
    deliveryNoteNumber: resolveDeliveryNoteNumber(
      items,
      parsedPayload.deliveryNoteNumber,
      existing
    ),
    postingDate: parsedPayload.postingDate,
    customerId: parsedPayload.customerId,
    warehouseId: parsedPayload.warehouseId,
    isReturn: parsedPayload.isReturn,
    status: parsedPayload.status,
    lines: parsedPayload.lines.map((line, index) => ({
      id: existing?.lines[index]?.id ?? `delivery-note-line:${randomUUID()}`,
      ...line,
    })),
    note: parsedPayload.note,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    createdByUserId: existing?.createdByUserId ?? userId,
  })
}

export async function listBillingDeliveryNotes(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)

  return billingDeliveryNoteListResponseSchema.parse({
    items: await readDeliveryNotes(database),
  })
}

export async function getBillingDeliveryNote(
  database: Kysely<unknown>,
  user: AuthUser,
  deliveryNoteId: string
) {
  assertBillingViewer(user)

  const item = (await readDeliveryNotes(database)).find((note) => note.id === deliveryNoteId)

  if (!item) {
    throw new ApplicationError("Delivery note could not be found.", { deliveryNoteId }, 404)
  }

  return billingDeliveryNoteResponseSchema.parse({ item })
}

export async function createBillingDeliveryNote(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const items = await readDeliveryNotes(database)
  const createdItem = buildDeliveryNoteRecord(items, payload, undefined, user.id)
  const nextItems = [createdItem, ...items]

  await replaceStorePayloads(
    database,
    billingTableNames.deliveryNotes,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "delivery-notes",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  return billingDeliveryNoteResponseSchema.parse({ item: createdItem })
}

export async function updateBillingDeliveryNote(
  database: Kysely<unknown>,
  user: AuthUser,
  deliveryNoteId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const items = await readDeliveryNotes(database)
  const existingItem = items.find((item) => item.id === deliveryNoteId)

  if (!existingItem) {
    throw new ApplicationError("Delivery note could not be found.", { deliveryNoteId }, 404)
  }

  const updatedItem = buildDeliveryNoteRecord(
    items,
    payload,
    existingItem,
    existingItem.createdByUserId
  )
  const nextItems = items.map((item) => (item.id === deliveryNoteId ? updatedItem : item))

  await replaceStorePayloads(
    database,
    billingTableNames.deliveryNotes,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "delivery-notes",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  return billingDeliveryNoteResponseSchema.parse({ item: updatedItem })
}
