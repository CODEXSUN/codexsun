import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../core/shared/index.js"
import {
  listProductRecords,
  replaceProductRecords,
} from "../../../ecommerce/src/services/product-admin-service.js"
import {
  productSchema,
  type Product,
  type ProductImage,
  type ProductPrice,
  type ProductSeo,
  type ProductStockItem,
  type ProductStorefront,
  type ProductTag,
  type StorefrontDepartment,
} from "../../../ecommerce/shared/index.js"
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

function placeholderImage(text: string, background: string, foreground = "243447") {
  return `https://placehold.co/900x1200/${background}/${foreground}?text=${encodeURIComponent(
    text
  )}`
}

function deriveDepartment(item: {
  itemGroup: string
  itemName: string
}): StorefrontDepartment {
  const content = `${item.itemGroup} ${item.itemName}`.toLowerCase()

  if (content.includes("women") || content.includes("ethnic") || content.includes("ladies")) {
    return "women"
  }

  if (content.includes("men") || content.includes("shirt") || content.includes("gents")) {
    return "men"
  }

  if (content.includes("kids") || content.includes("child") || content.includes("baby")) {
    return "kids"
  }

  return "accessories"
}

function deriveBasePrice(item: {
  itemGroup: string
  itemName: string
}) {
  const department = deriveDepartment(item)

  if (department === "women") {
    return 2490
  }

  if (department === "men") {
    return 1890
  }

  if (department === "kids") {
    return 1490
  }

  return 1290
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

function buildProductFromItem(item: (typeof frappeItemSchema)["_output"], existing: Product | null) {
  const timestamp = new Date().toISOString()
  const id = existing?.id ?? `product:frappe:${slugify(item.itemCode || item.itemName)}`
  const uuid = existing?.uuid ?? randomUUID()
  const basePrice = existing?.basePrice ?? deriveBasePrice(item)
  const costPrice = existing?.costPrice ?? Math.round(basePrice * 0.62)
  const brandName = item.brand || existing?.brandName || "Frappe Imported"
  const categoryName = item.itemGroup || existing?.categoryName || "Frappe Catalog"
  const department = deriveDepartment(item)
  const imageUrl =
    existing?.images[0]?.imageUrl ?? placeholderImage(item.itemName, "dbeafe")
  const images: ProductImage[] =
    existing?.images.length
      ? existing.images.map((image, index) => ({
          ...image,
          productId: id,
          sortOrder: index + 1,
          updatedAt: timestamp,
        }))
      : [
          {
            id: `product-image:${slugify(item.itemCode)}:primary`,
            productId: id,
            imageUrl,
            isPrimary: true,
            sortOrder: 1,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]
  const prices: ProductPrice[] =
    existing?.prices.length
      ? existing.prices.map((price) => ({
          ...price,
          productId: id,
          mrp: Math.max(price.mrp, basePrice),
          sellingPrice: basePrice,
          costPrice,
          updatedAt: timestamp,
        }))
      : [
          {
            id: `product-price:${slugify(item.itemCode)}:base`,
            productId: id,
            variantId: null,
            mrp: basePrice,
            sellingPrice: basePrice,
            costPrice,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]
  const stockItems: ProductStockItem[] =
    existing?.stockItems.length
      ? existing.stockItems.map((stockItem) => ({
          ...stockItem,
          productId: id,
          updatedAt: timestamp,
        }))
      : [
          {
            id: `stock-item:${slugify(item.itemCode)}:default`,
            productId: id,
            variantId: null,
            warehouseId:
              slugify(item.defaultWarehouse || "default-warehouse") || "warehouse",
            quantity: 0,
            reservedQuantity: 0,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]
  const seo: ProductSeo = existing?.seo ?? {
    id: `product-seo:${slugify(item.itemCode)}`,
    productId: id,
    metaTitle: item.itemName,
    metaDescription: item.description || item.itemName,
    metaKeywords: [item.brand, item.itemGroup, "frappe"].filter(Boolean).join(", "),
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const storefront: ProductStorefront = existing?.storefront ?? {
    id: `product-storefront:${slugify(item.itemCode)}`,
    productId: id,
    department,
    homeSliderEnabled: false,
    homeSliderOrder: 0,
    promoSliderEnabled: false,
    promoSliderOrder: 0,
    featureSectionEnabled: false,
    featureSectionOrder: 0,
    isNewArrival: true,
    isBestSeller: false,
    isFeaturedLabel: false,
    catalogBadge: "ERP",
    fabric: null,
    fit: null,
    sleeve: null,
    occasion: null,
    shippingNote: "Imported from Frappe connector.",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const tags: ProductTag[] = [
    {
      id: `product-tag:${slugify(item.itemCode)}:frappe`,
      name: "frappe",
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: `product-tag:${slugify(item.itemCode)}:${slugify(item.itemGroup || "catalog")}`,
      name: item.itemGroup || "catalog",
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  return productSchema.parse({
    ...(existing ?? {}),
    id,
    uuid,
    name: item.itemName,
    slug:
      existing?.slug ?? (slugify(item.itemName || item.itemCode) || slugify(id)),
    description: item.description || existing?.description || item.itemName,
    shortDescription:
      existing?.shortDescription ?? (item.description || item.itemName),
    brandId: existing?.brandId ?? `brand:${slugify(brandName)}`,
    brandName,
    categoryId: existing?.categoryId ?? `product-category:${slugify(categoryName)}`,
    categoryName,
    productGroupId:
      existing?.productGroupId ?? `product-group:${slugify(categoryName)}`,
    productGroupName: existing?.productGroupName ?? categoryName,
    productTypeId: existing?.productTypeId ?? "product-type:frappe-import",
    productTypeName: existing?.productTypeName ?? "Frappe import",
    unitId: existing?.unitId ?? `unit:${slugify(item.stockUom || "nos")}`,
    hsnCodeId: existing?.hsnCodeId ?? `hsn:${slugify(item.gstHsnCode || "na")}`,
    styleId: existing?.styleId ?? "style:frappe-import",
    sku: item.itemCode,
    hasVariants: existing?.hasVariants ?? item.hasVariants,
    basePrice,
    costPrice,
    taxId: existing?.taxId ?? "tax:gst-standard",
    isFeatured: existing?.isFeatured ?? false,
    isActive: !item.disabled,
    storefrontDepartment: existing?.storefrontDepartment ?? department,
    homeSliderEnabled: existing?.homeSliderEnabled ?? false,
    promoSliderEnabled: existing?.promoSliderEnabled ?? false,
    featureSectionEnabled: existing?.featureSectionEnabled ?? false,
    isNewArrival: existing?.isNewArrival ?? true,
    isBestSeller: existing?.isBestSeller ?? false,
    isFeaturedLabel: existing?.isFeaturedLabel ?? false,
    primaryImageUrl: images[0]?.imageUrl ?? null,
    variantCount: existing?.variants.length ?? 0,
    tagCount: tags.length,
    tagNames: tags.map((tag) => tag.name),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    images,
    variants: existing?.variants ?? [],
    prices,
    discounts: existing?.discounts ?? [],
    offers: existing?.offers ?? [],
    attributes: existing?.attributes ?? [],
    attributeValues: existing?.attributeValues ?? [],
    variantMap: existing?.variantMap ?? [],
    stockItems,
    stockMovements: existing?.stockMovements ?? [],
    seo: {
      ...seo,
      productId: id,
      updatedAt: timestamp,
    },
    storefront: {
      ...storefront,
      productId: id,
      department,
      updatedAt: timestamp,
    },
    tags,
    reviews: existing?.reviews ?? [],
  })
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
  const startedAt = new Date().toISOString()
  const items = await readItems(database)
  const products = await listProductRecords(database)
  const nextProducts = [...products]
  const nextItems = [...items]
  const syncResults: FrappeItemProductSyncResult[] = []
  const syncLogItems: FrappeItemProductSyncLogItem[] = []
  let successCount = 0
  let skippedCount = 0
  let failureCount = 0
  let productsChanged = false

  for (const itemId of itemIds) {
    const itemIndex = nextItems.findIndex((item) => item.id === itemId)

    if (itemIndex === -1) {
      failureCount += 1
      syncLogItems.push({
        frappeItemId: itemId,
        frappeItemCode: itemId,
        productId: null,
        productName: null,
        productSlug: null,
        mode: "failed",
        reason: "Frappe item could not be found.",
      })
      continue
    }

    const item = nextItems[itemIndex] as FrappeItem
    const existingProduct =
      nextProducts.find(
        (product) =>
          product.sku.trim().toLowerCase() === item.itemCode.trim().toLowerCase()
      ) ?? null

    if (existingProduct && parsedPayload.duplicateMode === "skip") {
      skippedCount += 1
      const skippedResult = {
        frappeItemId: item.id,
        frappeItemCode: item.itemCode,
        productId: existingProduct.id,
        productName: existingProduct.name,
        productSlug: existingProduct.slug,
        mode: "skipped" as const,
      }

      nextItems[itemIndex] = {
        ...item,
        syncedProductId: existingProduct.id,
        syncedProductName: existingProduct.name,
        syncedProductSlug: existingProduct.slug,
        isSyncedToProduct: true,
        modifiedAt: new Date().toISOString(),
      }
      syncResults.push(skippedResult)
      syncLogItems.push({
        ...skippedResult,
        reason: "Duplicate product exists and overwrite was skipped.",
      })
      continue
    }

    const syncedProduct = buildProductFromItem(item, existingProduct)
    const productMode = existingProduct ? "update" : "create"

    if (existingProduct) {
      const productIndex = nextProducts.findIndex(
        (product) => product.id === existingProduct.id
      )
      nextProducts[productIndex] = syncedProduct
    } else {
      nextProducts.push(syncedProduct)
    }

    productsChanged = true
    successCount += 1
    nextItems[itemIndex] = {
      ...item,
      syncedProductId: syncedProduct.id,
      syncedProductName: syncedProduct.name,
      syncedProductSlug: syncedProduct.slug,
      isSyncedToProduct: true,
      modifiedAt: new Date().toISOString(),
    }

    const syncResult = {
      frappeItemId: item.id,
      frappeItemCode: item.itemCode,
      productId: syncedProduct.id,
      productName: syncedProduct.name,
      productSlug: syncedProduct.slug,
      mode: productMode as "create" | "update",
    }

    syncResults.push(syncResult)
    syncLogItems.push({
      ...syncResult,
      reason: "",
    })
  }

  if (productsChanged) {
    await replaceProductRecords(database, nextProducts)
  }

  await replaceStorePayloads(database, frappeTableNames.items, nextItems.map((item, index) => ({
    id: item.id,
    moduleKey: "items",
    sortOrder: index + 1,
    payload: item,
    updatedAt: item.modifiedAt,
  })))

  const finishedAt = new Date().toISOString()
  const summary = `Synced ${successCount} of ${itemIds.length} item${itemIds.length === 1 ? "" : "s"}${skippedCount > 0 ? `, skipped ${skippedCount}` : ""}${failureCount > 0 ? `, failed ${failureCount}` : ""}.`
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
