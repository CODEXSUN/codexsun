import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappeItemManagerResponseSchema,
  frappeItemProductSyncLogManagerResponseSchema,
  frappeItemProductSyncLogSchema,
  frappeItemProductSyncPayloadSchema,
  frappeItemProductSyncResponseSchema,
  frappeItemResponseSchema,
  frappeItemSchema,
  frappeItemUpsertPayloadSchema,
  frappeReferenceOptionSchema,
  type FrappeItem,
  type FrappeItemProductSyncLogItem,
  type FrappeItemProductSyncResult,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import { assertFrappeViewer, assertSuperAdmin } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"
import { frappeSettingsSchema } from "../../shared/index.js"

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

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

async function readItems(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    frappeTableNames.items,
    frappeItemSchema
  )

  return items.sort((left, right) => left.itemCode.localeCompare(right.itemCode))
}

async function readItemSyncLogs(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    frappeTableNames.itemProductSyncLogs,
    frappeItemProductSyncLogSchema
  )

  return items.sort((left, right) => right.syncedAt.localeCompare(left.syncedAt))
}

async function readStoredDefaults(database: Kysely<unknown>) {
  const [settings] = await listStorePayloads(
    database,
    frappeTableNames.settings,
    frappeSettingsSchema
  )

  return settings ?? {
    defaultCompany: "",
    defaultWarehouse: "",
    defaultItemGroup: "",
    defaultPriceList: "",
  }
}

export async function listFrappeItems(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertFrappeViewer(user)

  const [items, defaults] = await Promise.all([
    readItems(database),
    readStoredDefaults(database),
  ])

  return frappeItemManagerResponseSchema.parse({
    manager: {
      items,
      references: {
        itemGroups: createReferenceOptions(items.map((item) => item.itemGroup)),
        stockUoms: createReferenceOptions(items.map((item) => item.stockUom)),
        warehouses: createReferenceOptions(
          items.map((item) => item.defaultWarehouse)
        ),
        brands: createReferenceOptions(items.map((item) => item.brand)),
        gstHsnCodes: createReferenceOptions(items.map((item) => item.gstHsnCode)),
        defaults: {
          company: defaults.defaultCompany,
          warehouse: defaults.defaultWarehouse,
          itemGroup: defaults.defaultItemGroup,
          priceList: defaults.defaultPriceList,
        },
      },
      syncedAt: new Date().toISOString(),
    },
  })
}

export async function getFrappeItem(
  database: Kysely<unknown>,
  user: AuthUser,
  itemId: string
) {
  assertFrappeViewer(user)

  const item = (await readItems(database)).find((entry) => entry.id === itemId)

  if (!item) {
    throw new ApplicationError("Frappe Item could not be found.", { itemId }, 404)
  }

  return frappeItemResponseSchema.parse({
    item,
  })
}

export async function createFrappeItem(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsedPayload = frappeItemUpsertPayloadSchema.parse(payload)
  const items = await readItems(database)

  if (
    items.some(
      (item) =>
        item.itemCode.trim().toLowerCase() ===
        parsedPayload.itemCode.trim().toLowerCase()
    )
  ) {
    throw new ApplicationError(
      "An item already exists for this Frappe item code.",
      { itemCode: parsedPayload.itemCode },
      409
    )
  }

  const createdItem = frappeItemSchema.parse({
    id: `frappe-item:${slugify(parsedPayload.itemCode) || randomUUID()}`,
    ...parsedPayload,
    defaultCompany: (await readStoredDefaults(database)).defaultCompany,
    modifiedAt: new Date().toISOString(),
    syncedProductId: "",
    syncedProductName: "",
    syncedProductSlug: "",
    isSyncedToProduct: false,
  })

  await replaceStorePayloads(database, frappeTableNames.items, [
    ...items,
    createdItem,
  ].map((item, index) => ({
    id: item.id,
    moduleKey: "items",
    sortOrder: index + 1,
    payload: item,
    updatedAt: item.modifiedAt,
  })))

  return frappeItemResponseSchema.parse({
    item: createdItem,
  })
}

export async function updateFrappeItem(
  database: Kysely<unknown>,
  user: AuthUser,
  itemId: string,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsedPayload = frappeItemUpsertPayloadSchema.parse(payload)
  const items = await readItems(database)
  const existingItem = items.find((item) => item.id === itemId)

  if (!existingItem) {
    throw new ApplicationError("Frappe Item could not be found.", { itemId }, 404)
  }

  const nextItems = items.map((item) =>
    item.id === itemId
      ? frappeItemSchema.parse({
          ...item,
          ...parsedPayload,
          modifiedAt: new Date().toISOString(),
        })
      : item
  )
  const updatedItem = nextItems.find((item) => item.id === itemId)!

  await replaceStorePayloads(database, frappeTableNames.items, nextItems.map((item, index) => ({
    id: item.id,
    moduleKey: "items",
    sortOrder: index + 1,
    payload: item,
    updatedAt: item.modifiedAt,
  })))

  return frappeItemResponseSchema.parse({
    item: updatedItem,
  })
}

export async function listFrappeItemProductSyncLogs(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertFrappeViewer(user)

  return frappeItemProductSyncLogManagerResponseSchema.parse({
    manager: {
      items: await readItemSyncLogs(database),
      syncedAt: new Date().toISOString(),
    },
  })
}

export async function syncFrappeItemsToProducts(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsedPayload = frappeItemProductSyncPayloadSchema.parse(payload)
  const itemIds = [...new Set(parsedPayload.itemIds.map((value) => value.trim()))]
  const items = await readItems(database)
  const startedAt = new Date().toISOString()
  const syncLogItems: FrappeItemProductSyncLogItem[] = itemIds.map((itemId) => {
    const item = items.find((entry) => entry.id === itemId) as FrappeItem | undefined

    return {
      frappeItemId: itemId,
      frappeItemCode: item?.itemCode ?? itemId,
      productId: null,
      productName: null,
      productSlug: null,
      mode: "failed",
      reason:
        "Ecommerce is scaffold-only right now. Product sync is unavailable until the ecommerce rebuild lands.",
    }
  })
  const failureCount = syncLogItems.length
  const finishedAt = new Date().toISOString()
  const summary = `Blocked ${failureCount} item sync request${failureCount === 1 ? "" : "s"} because ecommerce is scaffold-only.`
  const nextLog = frappeItemProductSyncLogSchema.parse({
    id: `frappe-sync-log:${randomUUID()}`,
    duplicateMode: parsedPayload.duplicateMode,
    requestedCount: itemIds.length,
    successCount: 0,
    skippedCount: 0,
    failureCount,
    startedAt,
    finishedAt,
    syncedAt: finishedAt,
    createdByUserId: user.id,
    summary,
    items: syncLogItems,
  })

  await replaceStorePayloads(database, frappeTableNames.itemProductSyncLogs, [
    nextLog,
    ...(await readItemSyncLogs(database)),
  ]
    .slice(0, 20)
    .map((item, index) => ({
      id: item.id,
      moduleKey: "item-sync-logs",
      sortOrder: index + 1,
      payload: item,
      updatedAt: item.syncedAt,
    })))

  throw new ApplicationError(
    "Ecommerce is scaffold-only right now. Product sync is unavailable until the ecommerce rebuild lands.",
    {
      itemIds,
      logId: nextLog.id,
    },
    409
  )
}
