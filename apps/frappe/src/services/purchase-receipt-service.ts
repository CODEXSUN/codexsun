import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../core/shared/index.js"
import { findProductRecordBySku } from "../../../ecommerce/src/services/product-admin-service.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappeItemSchema,
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
import { syncFrappeItemsToProducts } from "./item-service.js"
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

async function readItems(database: Kysely<unknown>) {
  return listStorePayloads(database, frappeTableNames.items, frappeItemSchema)
}

async function decorateReceipt(
  database: Kysely<unknown>,
  receipt: FrappePurchaseReceipt
) {
  const products = await Promise.all(
    receipt.items.map((item) => findProductRecordBySku(database, item.itemCode))
  )
  const decoratedItems = receipt.items.map((item, index) => {
    const linkedProduct = products[index]

    if (!linkedProduct) {
      return {
        ...item,
        productId: "",
        productName: "",
        productSlug: "",
        isSyncedToProduct: false,
      }
    }

    return {
      ...item,
      productId: linkedProduct.id,
      productName: linkedProduct.name,
      productSlug: linkedProduct.slug,
      isSyncedToProduct: true,
    }
  })

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
  const items = await Promise.all(
    receipts.map((receipt) => decorateReceipt(database, receipt))
  )

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
    item: await decorateReceipt(database, receipt),
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
    throw new ApplicationError(
      "One or more purchase receipts could not be found.",
      { receiptIds },
      404
    )
  }

  const itemCodes = [...new Set(
    selectedReceipts.flatMap((receipt) => receipt.items.map((item) => item.itemCode))
  )]
  const allItems = await readItems(database)

  const syncItemIds = allItems
    .filter((item) => itemCodes.includes(item.itemCode))
    .map((item) => item.id)

  if (syncItemIds.length > 0) {
    await syncFrappeItemsToProducts(database, user, {
      itemIds: syncItemIds,
      duplicateMode: "overwrite",
    })
  }

  const syncedAt = new Date().toISOString()
  const syncResults: FrappePurchaseReceiptSyncResult[] = []
  const nextReceipts = await Promise.all(
    receipts.map(async (receipt) => {
      if (!receiptIds.includes(receipt.id)) {
        return decorateReceipt(database, receipt)
      }

      const wasSynced = receipt.isSyncedLocally || Boolean(receipt.syncedRecordId)
      const decoratedReceipt = await decorateReceipt(database, receipt)
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
  )

  await replaceStorePayloads(database, frappeTableNames.purchaseReceipts, nextReceipts.map((receipt, index) => ({
    id: receipt.id,
    moduleKey: "purchase-receipts",
    sortOrder: index + 1,
    payload: receipt,
    updatedAt: receipt.modifiedAt,
  })))

  return frappePurchaseReceiptSyncResponseSchema.parse({
    sync: {
      items: syncResults,
      syncedAt,
    },
  })
}
