import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import {
  createProduct,
  listProducts,
  updateProduct,
} from "../../../core/src/services/product-service.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappeItemManagerResponseSchema,
  frappeItemPullLiveResponseSchema,
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
import { readFrappeEnvConfig, type FrappeEnvConfig } from "../config/frappe.js"
import { assertFrappeViewer, assertSuperAdmin } from "./access.js"
import {
  createFrappeConnection,
  readFrappeErrorText,
} from "./connection.js"
import { recordFrappeConnectorEvent } from "./observability-service.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"
import { readStoredFrappeSettings } from "./settings-service.js"

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
  const products = await listStorePayloads(
    database,
    frappeTableNames.products,
    frappeItemSchema
  )

  const items =
    products.length > 0
      ? products
      : await listStorePayloads(
          database,
          frappeTableNames.items,
          frappeItemSchema
        )

  return items.sort((left, right) => left.itemCode.localeCompare(right.itemCode))
}

function writeItems(database: Kysely<unknown>, items: FrappeItem[]) {
  return replaceStorePayloads(database, frappeTableNames.products, items.map((item, index) => ({
    id: item.id,
    moduleKey: "products",
    sortOrder: index + 1,
    payload: item,
    updatedAt: item.modifiedAt,
  })))
}

async function readItemSyncLogs(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    frappeTableNames.itemProductSyncLogs,
    frappeItemProductSyncLogSchema
  )

  return items.sort((left, right) => right.syncedAt.localeCompare(left.syncedAt))
}

type FrappeItemServiceOptions = {
  config?: FrappeEnvConfig
  cwd?: string
}

async function readStoredDefaults(
  database: Kysely<unknown>,
  options?: FrappeItemServiceOptions
) {
  return readStoredFrappeSettings(database, options)
}

async function createVerifiedItemConnection(
  database: Kysely<unknown>,
  options?: FrappeItemServiceOptions
) {
  const settings = await readStoredDefaults(database, options)
  const config = options?.config ?? readFrappeEnvConfig(options?.cwd)

  if (!settings.enabled || !settings.isConfigured) {
    throw new ApplicationError("ERPNext connector must be enabled and configured before item pull.", {}, 409)
  }

  if (settings.lastVerificationStatus !== "passed") {
    throw new ApplicationError("ERPNext connector must be verified successfully before item pull.", {}, 409)
  }

  return createFrappeConnection(config)
}

function toLocalItem(
  remoteItem: Record<string, unknown>,
  defaults: Awaited<ReturnType<typeof readStoredDefaults>>,
  existingItem?: FrappeItem | null
) {
  const itemCode =
    typeof remoteItem.item_code === "string" ? remoteItem.item_code.trim() : ""
  const itemName =
    typeof remoteItem.item_name === "string" ? remoteItem.item_name.trim() : ""

  if (!itemCode || !itemName) {
    throw new ApplicationError("ERPNext Item response is missing item_code or item_name.", {}, 502)
  }

  return frappeItemSchema.parse({
    id: existingItem?.id || `frappe-item:${slugify(itemCode) || randomUUID()}`,
    itemCode,
    itemName,
    description:
      typeof remoteItem.description === "string" ? remoteItem.description.trim() : "",
    itemGroup:
      typeof remoteItem.item_group === "string" ? remoteItem.item_group.trim() : "",
    stockUom:
      typeof remoteItem.stock_uom === "string" ? remoteItem.stock_uom.trim() : "",
    brand: typeof remoteItem.brand === "string" ? remoteItem.brand.trim() : "",
    gstHsnCode:
      typeof remoteItem.gst_hsn_code === "string" ? remoteItem.gst_hsn_code.trim() : "",
    defaultCompany: existingItem?.defaultCompany || defaults.defaultCompany,
    defaultWarehouse:
      typeof remoteItem.default_warehouse === "string" && remoteItem.default_warehouse.trim()
        ? remoteItem.default_warehouse.trim()
        : existingItem?.defaultWarehouse || defaults.defaultWarehouse,
    disabled:
      typeof remoteItem.disabled === "boolean"
        ? remoteItem.disabled
        : Number(remoteItem.disabled ?? 0) !== 0,
    isStockItem:
      typeof remoteItem.is_stock_item === "boolean"
        ? remoteItem.is_stock_item
        : Number(remoteItem.is_stock_item ?? 1) !== 0,
    hasVariants:
      typeof remoteItem.has_variants === "boolean"
        ? remoteItem.has_variants
        : Number(remoteItem.has_variants ?? 0) !== 0,
    modifiedAt:
      typeof remoteItem.modified === "string"
        ? remoteItem.modified
        : new Date().toISOString(),
    syncedProductId: existingItem?.syncedProductId || "",
    syncedProductName: existingItem?.syncedProductName || "",
    syncedProductSlug: existingItem?.syncedProductSlug || "",
    isSyncedToProduct: existingItem?.isSyncedToProduct || false,
  })
}

async function readRemoteItems(
  connection: ReturnType<typeof createFrappeConnection>,
  defaults: Awaited<ReturnType<typeof readStoredDefaults>>,
  existingItems: FrappeItem[]
) {
  const fields = encodeURIComponent(
    JSON.stringify([
      "item_code",
      "item_name",
      "description",
      "item_group",
      "stock_uom",
      "brand",
      "gst_hsn_code",
      "disabled",
      "is_stock_item",
      "has_variants",
      "modified",
    ])
  )
  const { response } = await connection.request({
    path: `/api/resource/Item?fields=${fields}&limit_page_length=5000`,
  })

  if (!response.ok) {
    throw new ApplicationError(
      "ERPNext rejected the item pull request.",
      { detail: await readFrappeErrorText(response) },
      response.status
    )
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: unknown }
    | null

  if (!Array.isArray(payload?.data)) {
    throw new ApplicationError("ERPNext item pull returned an invalid payload.", {}, 502)
  }

  const existingItemsByCode = new Map(
    existingItems.map((item) => [item.itemCode.trim().toLowerCase(), item])
  )

  return payload.data.map((item) =>
    toLocalItem(
      item && typeof item === "object" ? item as Record<string, unknown> : {},
      defaults,
      existingItemsByCode.get(
        typeof (item as Record<string, unknown>)?.item_code === "string"
          ? ((item as Record<string, unknown>).item_code as string).trim().toLowerCase()
          : ""
      ) ?? null
    )
  )
}

function toProjectedProductPayload(item: FrappeItem) {
  const slugBase = slugify(item.itemName) || slugify(item.itemCode) || randomUUID()
  const timestamp = new Date().toISOString()

  return {
    code: item.itemCode,
    name: item.itemName,
    slug: slugBase,
    description: item.description,
    shortDescription: item.itemName,
    brandId: null,
    brandName: item.brand,
    categoryId: null,
    categoryName: item.itemGroup,
    productGroupId: null,
    productGroupName: item.itemGroup,
    productTypeId: null,
    productTypeName: item.isStockItem ? "Finished Good" : "Service",
    unitId: null,
    hsnCodeId: item.gstHsnCode || null,
    styleId: null,
    sku: item.itemCode,
    hasVariants: item.hasVariants,
    basePrice: 0,
    costPrice: 0,
    taxId: null,
    isFeatured: false,
    isActive: !item.disabled,
    storefrontDepartment: null,
    homeSliderEnabled: false,
    promoSliderEnabled: false,
    featureSectionEnabled: false,
    isNewArrival: false,
    isBestSeller: false,
    isFeaturedLabel: false,
    images: [],
    variants: [],
    prices: [],
    discounts: [],
    offers: [],
    attributes: [],
    attributeValues: [],
    variantMap: [],
    stockItems: [],
    stockMovements: [],
    seo: {
      metaTitle: item.itemName,
      metaDescription: item.description || item.itemName,
      metaKeywords: `${item.brand}, ${item.itemGroup}, ${item.itemCode}`,
      isActive: true,
    },
    storefront: {
      department: null,
      homeSliderEnabled: false,
      homeSliderOrder: 0,
      promoSliderEnabled: false,
      promoSliderOrder: 0,
      featureSectionEnabled: false,
      featureSectionOrder: 0,
      isNewArrival: false,
      isBestSeller: false,
      isFeaturedLabel: false,
      catalogBadge: null,
      promoBadge: null,
      promoTitle: null,
      promoSubtitle: null,
      promoCtaLabel: null,
      fabric: null,
      fit: null,
      sleeve: null,
      occasion: null,
      shippingNote: "Projected from Frappe item snapshot.",
      shippingCharge: null,
      handlingCharge: null,
      isActive: true,
    },
    tags: [
      { name: "frappe", isActive: true },
      { name: slugify(item.itemGroup) || "projected", isActive: true },
    ],
    reviews: [],
    _projectedAt: timestamp,
  }
}

async function resolveTargetProductId(
  database: Kysely<unknown>,
  item: FrappeItem
) {
  const products = await listProducts(database)

  const linkedProduct = item.syncedProductId
    ? products.items.find((product) => product.id === item.syncedProductId)
    : null

  if (linkedProduct) {
    return linkedProduct.id
  }

  const directMatch = products.items.find(
    (product) =>
      product.code.trim().toLowerCase() === item.itemCode.trim().toLowerCase() ||
      product.sku.trim().toLowerCase() === item.itemCode.trim().toLowerCase()
  )

  return directMatch?.id ?? null
}

export async function listFrappeItems(
  database: Kysely<unknown>,
  user: AuthUser,
  options?: FrappeItemServiceOptions
) {
  assertFrappeViewer(user)

  const [items, defaults] = await Promise.all([
    readItems(database),
    readStoredDefaults(database, options),
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
  payload: unknown,
  options?: FrappeItemServiceOptions
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
    defaultCompany: (await readStoredDefaults(database, options)).defaultCompany,
    modifiedAt: new Date().toISOString(),
    syncedProductId: "",
    syncedProductName: "",
    syncedProductSlug: "",
    isSyncedToProduct: false,
  })

  await writeItems(database, [
    ...items,
    createdItem,
  ])

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

  await writeItems(database, nextItems)

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
  const selectedItems = itemIds.map((itemId) => items.find((entry) => entry.id === itemId) ?? null)

  if (selectedItems.some((item) => item == null)) {
    throw new ApplicationError(
      "One or more Frappe items could not be found.",
      { itemIds },
      404
    )
  }

  const syncLogItems: FrappeItemProductSyncLogItem[] = []
  const syncResults: FrappeItemProductSyncResult[] = []
  const nextItems = [...items]

  for (const item of selectedItems as FrappeItem[]) {
    const targetProductId = await resolveTargetProductId(database, item)

    if (
      parsedPayload.duplicateMode === "skip" &&
      targetProductId &&
      !item.syncedProductId
    ) {
      syncLogItems.push({
        frappeItemId: item.id,
        frappeItemCode: item.itemCode,
        productId: targetProductId,
        productName: null,
        productSlug: null,
        mode: "skipped",
        reason:
          "A matching core product already exists for this item code and duplicate mode is skip.",
      })
      continue
    }

    try {
      const projectionPayload = toProjectedProductPayload(item)
      const productResponse = targetProductId
        ? await updateProduct(database, user, targetProductId, projectionPayload)
        : await createProduct(database, user, projectionPayload)
      const mode = targetProductId ? "update" : "create"

      syncResults.push({
        frappeItemId: item.id,
        frappeItemCode: item.itemCode,
        productId: productResponse.item.id,
        productName: productResponse.item.name,
        productSlug: productResponse.item.slug,
        mode,
      })
      syncLogItems.push({
        frappeItemId: item.id,
        frappeItemCode: item.itemCode,
        productId: productResponse.item.id,
        productName: productResponse.item.name,
        productSlug: productResponse.item.slug,
        mode,
        reason: "",
      })

      const nextItem = frappeItemSchema.parse({
        ...item,
        modifiedAt: new Date().toISOString(),
        syncedProductId: productResponse.item.id,
        syncedProductName: productResponse.item.name,
        syncedProductSlug: productResponse.item.slug,
        isSyncedToProduct: true,
      })
      const nextIndex = nextItems.findIndex((entry) => entry.id === item.id)
      if (nextIndex >= 0) {
        nextItems[nextIndex] = nextItem
      }
    } catch (error) {
      syncLogItems.push({
        frappeItemId: item.id,
        frappeItemCode: item.itemCode,
        productId: targetProductId,
        productName: null,
        productSlug: null,
        mode: "failed",
        reason: error instanceof Error ? error.message : "Projection failed.",
      })
    }
  }

  await writeItems(database, nextItems)

  const successCount = syncLogItems.filter((item) => item.mode === "create" || item.mode === "update").length
  const skippedCount = syncLogItems.filter((item) => item.mode === "skipped").length
  const failureCount = syncLogItems.filter((item) => item.mode === "failed").length
  const finishedAt = new Date().toISOString()
  const summary = `Processed ${itemIds.length} Frappe item projection request${itemIds.length === 1 ? "" : "s"} into core products: ${successCount} synced, ${skippedCount} skipped, ${failureCount} failed.`
  const nextLog = frappeItemProductSyncLogSchema.parse({
    id: `frappe-sync-log:${randomUUID()}`,
    duplicateMode: parsedPayload.duplicateMode,
    requestedCount: itemIds.length,
    successCount,
    skippedCount,
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

  await recordFrappeConnectorEvent(database, user, {
    action: "items.sync_products",
    status: failureCount > 0 ? "failure" : "success",
    message:
      failureCount > 0
        ? `Frappe item projection completed with ${failureCount} failure${failureCount === 1 ? "" : "s"}.`
        : `Frappe item projection completed for ${successCount} item${successCount === 1 ? "" : "s"}.`,
    referenceId: nextLog.id,
    details: {
      requestedCount: itemIds.length,
      duplicateMode: parsedPayload.duplicateMode,
      successCount,
      skippedCount,
      failureCount,
    },
  })

  return frappeItemProductSyncResponseSchema.parse({
    sync: {
      items: syncResults,
      summary: {
        logId: nextLog.id,
        requestedCount: itemIds.length,
        successCount,
        skippedCount,
        failureCount,
      },
      syncedAt: finishedAt,
    },
  })
}

export async function pullFrappeItemsLive(
  database: Kysely<unknown>,
  user: AuthUser,
  options?: FrappeItemServiceOptions
) {
  assertSuperAdmin(user)

  const existingItems = await readItems(database)
  const defaults = await readStoredDefaults(database, options)
  const connection = await createVerifiedItemConnection(database, options)
  const remoteItems = await readRemoteItems(connection, defaults, existingItems)
  const existingItemsByCode = new Map(
    existingItems.map((item) => [item.itemCode.trim().toLowerCase(), item])
  )
  const syncedAt = new Date().toISOString()
  let pulledCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const item of remoteItems) {
    const existingItem = existingItemsByCode.get(item.itemCode.trim().toLowerCase())

    if (!existingItem) {
      pulledCount += 1
      continue
    }

    if (JSON.stringify(existingItem) === JSON.stringify(item)) {
      skippedCount += 1
      continue
    }

    updatedCount += 1
  }

  await writeItems(database, remoteItems)
  await recordFrappeConnectorEvent(database, user, {
    action: "items.pull_live",
    status: "success",
    message: `Frappe item pull completed: ${pulledCount} new, ${updatedCount} updated, ${skippedCount} unchanged.`,
    referenceId: "frappe-products:pull-live",
    details: {
      pulledCount,
      updatedCount,
      skippedCount,
      appRecordCount: remoteItems.length,
    },
  })

  return frappeItemPullLiveResponseSchema.parse({
    sync: {
      pulledCount,
      updatedCount,
      skippedCount,
      appRecordCount: remoteItems.length,
      syncedAt,
      items: remoteItems,
    },
  })
}
