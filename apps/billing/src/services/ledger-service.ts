import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  billingLedgerListResponseSchema,
  billingLedgerResponseSchema,
  billingLedgerSchema,
  billingLedgerUpsertPayloadSchema,
  billingVoucherSchema,
} from "../../shared/index.js"
import type { AuthUser } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import {
  getStorePayloadById,
  listStorePayloads,
  replaceStorePayloads,
} from "./store.js"

export async function listBillingLedgers(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    billingTableNames.ledgers,
    billingLedgerSchema
  )

  return billingLedgerListResponseSchema.parse({
    items,
  })
}

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

async function readVouchers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.vouchers, billingVoucherSchema)
}

export async function getBillingLedger(
  database: Kysely<unknown>,
  user: AuthUser,
  ledgerId: string
) {
  assertBillingViewer(user)

  const item = await getStorePayloadById(
    database,
    billingTableNames.ledgers,
    ledgerId,
    billingLedgerSchema
  )

  if (!item) {
    throw new ApplicationError("Billing ledger could not be found.", { ledgerId }, 404)
  }

  return billingLedgerResponseSchema.parse({ item })
}

export async function createBillingLedger(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingLedgerUpsertPayloadSchema.parse(payload)
  const items = await readLedgers(database)
  const duplicate = items.find(
    (item) => item.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError("Ledger name already exists.", { name: parsedPayload.name }, 409)
  }

  const item = billingLedgerSchema.parse({
    id: `ledger:${randomUUID()}`,
    ...parsedPayload,
  })

  await replaceStorePayloads(database, billingTableNames.ledgers, [
    ...items.map((entry) => ({
      id: entry.id,
      moduleKey: "billing/ledgers",
      payload: entry,
    })),
    {
      id: item.id,
      moduleKey: "billing/ledgers",
      payload: item,
    },
  ])

  return billingLedgerResponseSchema.parse({ item })
}

export async function updateBillingLedger(
  database: Kysely<unknown>,
  user: AuthUser,
  ledgerId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingLedgerUpsertPayloadSchema.parse(payload)
  const items = await readLedgers(database)
  const existing = items.find((item) => item.id === ledgerId)

  if (!existing) {
    throw new ApplicationError("Billing ledger could not be found.", { ledgerId }, 404)
  }

  const duplicate = items.find(
    (item) =>
      item.id !== ledgerId &&
      item.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError("Ledger name already exists.", { name: parsedPayload.name }, 409)
  }

  const item = billingLedgerSchema.parse({
    id: existing.id,
    ...parsedPayload,
  })

  await replaceStorePayloads(
    database,
    billingTableNames.ledgers,
    items.map((entry) => ({
      id: entry.id,
      moduleKey: "billing/ledgers",
      payload: entry.id === ledgerId ? item : entry,
    }))
  )

  return billingLedgerResponseSchema.parse({ item })
}

export async function deleteBillingLedger(
  database: Kysely<unknown>,
  user: AuthUser,
  ledgerId: string
) {
  assertBillingViewer(user)

  const items = await readLedgers(database)
  const existing = items.find((item) => item.id === ledgerId)

  if (!existing) {
    throw new ApplicationError("Billing ledger could not be found.", { ledgerId }, 404)
  }

  const vouchers = await readVouchers(database)
  const isReferenced = vouchers.some(
    (voucher) =>
      voucher.lines.some((line) => line.ledgerId === ledgerId) ||
      voucher.gst?.partyLedgerId === ledgerId ||
      voucher.gst?.taxableLedgerId === ledgerId
  )

  if (isReferenced) {
    throw new ApplicationError(
      "Ledger cannot be deleted because it is referenced by posted vouchers.",
      { ledgerId },
      409
    )
  }

  await replaceStorePayloads(
    database,
    billingTableNames.ledgers,
    items
      .filter((item) => item.id !== ledgerId)
      .map((item) => ({
        id: item.id,
        moduleKey: "billing/ledgers",
        payload: item,
      }))
  )

  return {
    deleted: true as const,
    id: ledgerId,
  }
}
