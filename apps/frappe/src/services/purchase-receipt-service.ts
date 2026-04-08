import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappePurchaseReceiptManagerResponseSchema,
  frappePurchaseReceiptResponseSchema,
  frappePurchaseReceiptSchema,
  frappePurchaseReceiptSyncPayloadSchema,
  frappePurchaseReceiptSyncResponseSchema,
  frappeReferenceOptionSchema,
  type FrappePurchaseReceipt,
  type FrappePurchaseReceiptSyncResult,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import { assertFrappeViewer, assertSuperAdmin } from "./access.js"
import { recordFrappeConnectorEvent } from "./observability-service.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"
import { frappeSettingsSchema } from "../../shared/index.js"

function createReferenceOptions(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .map((value) =>
      frappeReferenceOptionSchema.parse({
        id: value,
        label: value,
        description: "",
        disabled: false,
        isGroup: false,
      })
    )
}

async function readReceipts(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    frappeTableNames.purchaseReceipts,
    frappePurchaseReceiptSchema
  )

  return items.sort((left, right) =>
    right.postingDate.localeCompare(left.postingDate)
  )
}

async function readStoredSettings(database: Kysely<unknown>) {
  const [settings] = await listStorePayloads(
    database,
    frappeTableNames.settings,
    frappeSettingsSchema
  )

  return settings ?? {
    defaultCompany: "",
    defaultWarehouse: "",
  }
}

function decorateReceipt(receipt: FrappePurchaseReceipt) {
  const decoratedItems = receipt.items.map((item) => ({
    ...item,
    productId: "",
    productName: "",
    productSlug: "",
    isSyncedToProduct: false,
  }))

  return frappePurchaseReceiptSchema.parse({
    ...receipt,
    items: decoratedItems,
    linkedProductCount: decoratedItems.filter((item) => item.isSyncedToProduct).length,
    itemCount: decoratedItems.length,
  })
}

export async function listFrappePurchaseReceipts(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertFrappeViewer(user)

  const [receipts, settings] = await Promise.all([
    readReceipts(database),
    readStoredSettings(database),
  ])
  const items = receipts.map((receipt) => decorateReceipt(receipt))

  return frappePurchaseReceiptManagerResponseSchema.parse({
    manager: {
      items,
      references: {
        suppliers: createReferenceOptions(items.map((item) => item.supplierName)),
        companies: createReferenceOptions(items.map((item) => item.company)),
        warehouses: createReferenceOptions(items.map((item) => item.warehouse)),
        statuses: createReferenceOptions(items.map((item) => item.status)),
        defaults: {
          company: settings.defaultCompany,
          warehouse: settings.defaultWarehouse,
        },
      },
      syncedAt: new Date().toISOString(),
    },
  })
}

export async function getFrappePurchaseReceipt(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string
) {
  assertFrappeViewer(user)

  const receipt = (await readReceipts(database)).find((item) => item.id === receiptId)

  if (!receipt) {
    throw new ApplicationError(
      "Frappe Purchase Receipt could not be found.",
      { receiptId },
      404
    )
  }

  return frappePurchaseReceiptResponseSchema.parse({
    item: decorateReceipt(receipt),
  })
}

export async function syncFrappePurchaseReceipts(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsedPayload = frappePurchaseReceiptSyncPayloadSchema.parse(payload)
  const receiptIds = [...new Set(parsedPayload.receiptIds.map((value) => value.trim()))]
  const receipts = await readReceipts(database)
  const selectedReceipts = receipts.filter((receipt) => receiptIds.includes(receipt.id))

  if (selectedReceipts.length !== receiptIds.length) {
    await recordFrappeConnectorEvent(database, user, {
      action: "purchase_receipts.sync",
      status: "failure",
      message: "Frappe purchase receipt sync failed because one or more receipts were missing.",
      referenceId: receiptIds[0] ?? null,
      details: {
        requestedCount: receiptIds.length,
        selectedCount: selectedReceipts.length,
      },
    })

    throw new ApplicationError(
      "One or more purchase receipts could not be found.",
      { receiptIds },
      404
    )
  }

  const syncedAt = new Date().toISOString()
  const syncResults: FrappePurchaseReceiptSyncResult[] = []
  const nextReceipts = receipts.map((receipt) => {
      if (!receiptIds.includes(receipt.id)) {
        return decorateReceipt(receipt)
      }

      const wasSynced = receipt.isSyncedLocally || Boolean(receipt.syncedRecordId)
      const decoratedReceipt = decorateReceipt(receipt)
      const nextReceipt = frappePurchaseReceiptSchema.parse({
        ...decoratedReceipt,
        syncedRecordId:
          decoratedReceipt.syncedRecordId || `receipt-sync:${randomUUID()}`,
        syncedAt,
        isSyncedLocally: true,
        modifiedAt: syncedAt,
      })

      syncResults.push({
        frappeReceiptId: nextReceipt.id,
        receiptNumber: nextReceipt.receiptNumber,
        syncedRecordId: nextReceipt.syncedRecordId || nextReceipt.id,
        itemCount: nextReceipt.itemCount,
        linkedProductCount: nextReceipt.linkedProductCount,
        mode: wasSynced ? "update" : "create",
      })

      return nextReceipt
    })

  await replaceStorePayloads(database, frappeTableNames.purchaseReceipts, nextReceipts.map((receipt, index) => ({
    id: receipt.id,
    moduleKey: "purchase-receipts",
    sortOrder: index + 1,
    payload: receipt,
    updatedAt: receipt.modifiedAt,
  })))

  await recordFrappeConnectorEvent(database, user, {
    action: "purchase_receipts.sync",
    status: "success",
    message: `Frappe purchase receipt sync completed for ${syncResults.length} receipt${syncResults.length === 1 ? "" : "s"}.`,
    referenceId: syncResults[0]?.syncedRecordId ?? null,
    details: {
      requestedCount: receiptIds.length,
      successCount: syncResults.length,
      createdCount: syncResults.filter((item) => item.mode === "create").length,
      updatedCount: syncResults.filter((item) => item.mode === "update").length,
    },
  })

  return frappePurchaseReceiptSyncResponseSchema.parse({
    sync: {
      items: syncResults,
      syncedAt,
    },
  })
}
