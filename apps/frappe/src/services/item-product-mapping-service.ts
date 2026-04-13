import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { listProducts } from "../../../core/src/services/product-service.js"
import { productUpsertPayloadSchema } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappeItemProductMappingResponseSchema,
  frappeItemProductMappingSchema,
  frappeItemProductMappingUpsertPayloadSchema,
  type FrappeItem,
  type FrappeItemProductMapping,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import { assertFrappeViewer, assertSuperAdmin } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function trimOrEmpty(value: string | null | undefined) {
  return value?.trim() ?? ""
}

function trimOrNull(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed ? trimmed : null
}

async function readMappings(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    frappeTableNames.itemProductMappings,
    frappeItemProductMappingSchema
  )
}

async function writeMappings(
  database: Kysely<unknown>,
  items: FrappeItemProductMapping[]
) {
  await replaceStorePayloads(
    database,
    frappeTableNames.itemProductMappings,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "item-product-mappings",
      sortOrder: index + 1,
      payload: item,
      updatedAt: item.updatedAt,
    }))
  )
}

export function createDefaultItemProductMapping(item: FrappeItem) {
  return frappeItemProductMappingSchema.parse({
    id: `frappe-item-map:${slugify(item.itemCode) || randomUUID()}`,
    itemId: item.id,
    itemCode: item.itemCode,
    targetProductId: item.syncedProductId,
    productName: item.syncedProductName || item.itemName,
    productSlug: item.syncedProductSlug || slugify(item.itemName) || slugify(item.itemCode),
    shortDescription: item.itemName,
    categoryName: item.itemGroup,
    productGroupName: item.itemGroup,
    productTypeName: item.isStockItem ? "Finished Good" : "Service",
    brandName: item.brand,
    hsnCodeId: item.gstHsnCode,
    sku: item.itemCode,
    storefrontDepartment:
      item.itemGroup.trim().toLowerCase() === "shirts"
        ? "men"
        : item.itemGroup.trim().toLowerCase() === "accessories"
          ? "accessories"
          : null,
    isActive: !item.disabled,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    isFeaturedLabel: false,
    catalogBadge: "ERP Synced",
    promoBadge: "",
    shippingNote: "Projected from Frappe item snapshot.",
    tagNames: ["frappe", slugify(item.itemGroup) || "projected"],
    notes: "",
    updatedAt: new Date().toISOString(),
  })
}

export async function readResolvedItemProductMapping(
  database: Kysely<unknown>,
  item: FrappeItem
) {
  const mappings = await readMappings(database)
  const storedMapping =
    mappings.find((entry) => entry.itemId === item.id) ??
    mappings.find(
      (entry) => entry.itemCode.trim().toLowerCase() === item.itemCode.trim().toLowerCase()
    )

  return storedMapping ?? createDefaultItemProductMapping(item)
}

export async function resolveTargetCoreProductSummary(
  database: Kysely<unknown>,
  item: FrappeItem,
  mapping: FrappeItemProductMapping
) {
  const products = await listProducts(database)
  const targetProduct =
    (mapping.targetProductId
      ? products.items.find((entry) => entry.id === mapping.targetProductId)
      : null) ??
    (item.syncedProductId
      ? products.items.find((entry) => entry.id === item.syncedProductId)
      : null) ??
    products.items.find(
      (entry) =>
        entry.code.trim().toLowerCase() === item.itemCode.trim().toLowerCase() ||
        entry.sku.trim().toLowerCase() === trimOrEmpty(mapping.sku || item.itemCode).toLowerCase()
    ) ??
    null

  if (!targetProduct) {
    return null
  }

  return {
    id: targetProduct.id,
    code: targetProduct.code,
    sku: targetProduct.sku,
    name: targetProduct.name,
    slug: targetProduct.slug,
    isActive: targetProduct.isActive,
    storefrontDepartment: targetProduct.storefrontDepartment,
    catalogBadge: null,
  }
}

export function buildItemProductProjectionDraft(
  item: FrappeItem,
  mapping: FrappeItemProductMapping
) {
  const name = trimOrEmpty(mapping.productName) || item.itemName
  const slug = trimOrEmpty(mapping.productSlug) || slugify(name) || slugify(item.itemCode)
  const categoryName = trimOrEmpty(mapping.categoryName) || item.itemGroup
  const productGroupName = trimOrEmpty(mapping.productGroupName) || item.itemGroup
  const brandName = trimOrEmpty(mapping.brandName) || item.brand
  const hsnCodeId = trimOrEmpty(mapping.hsnCodeId) || item.gstHsnCode
  const sku = trimOrEmpty(mapping.sku) || item.itemCode
  const tagNames = [...new Set(["frappe", ...mapping.tagNames.map((entry) => entry.trim()).filter(Boolean)])]

  return productUpsertPayloadSchema.parse({
    code: item.itemCode,
    name,
    slug,
    description: trimOrNull(item.description),
    shortDescription: trimOrNull(mapping.shortDescription) ?? item.itemName,
    brandId: null,
    brandName: trimOrNull(brandName),
    categoryId: null,
    categoryName: trimOrNull(categoryName),
    productGroupId: null,
    productGroupName: trimOrNull(productGroupName),
    productTypeId: null,
    productTypeName:
      trimOrNull(mapping.productTypeName) ?? (item.isStockItem ? "Finished Good" : "Service"),
    unitId: null,
    hsnCodeId: trimOrNull(hsnCodeId),
    styleId: null,
    sku,
    hasVariants: item.hasVariants,
    basePrice: 0,
    costPrice: 0,
    taxId: null,
    isFeatured: mapping.isFeatured,
    isActive: mapping.isActive,
    storefrontDepartment:
      mapping.storefrontDepartment === "women" ||
      mapping.storefrontDepartment === "men" ||
      mapping.storefrontDepartment === "kids" ||
      mapping.storefrontDepartment === "accessories"
        ? mapping.storefrontDepartment
        : null,
    homeSliderEnabled: false,
    promoSliderEnabled: false,
    featureSectionEnabled: false,
    isNewArrival: mapping.isNewArrival,
    isBestSeller: mapping.isBestSeller,
    isFeaturedLabel: mapping.isFeaturedLabel,
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
      metaTitle: name,
      metaDescription: trimOrNull(item.description) ?? name,
      metaKeywords: [brandName, categoryName, item.itemCode].filter(Boolean).join(", "),
      isActive: true,
    },
    storefront: {
      department:
        mapping.storefrontDepartment === "women" ||
        mapping.storefrontDepartment === "men" ||
        mapping.storefrontDepartment === "kids" ||
        mapping.storefrontDepartment === "accessories"
          ? mapping.storefrontDepartment
          : null,
      homeSliderEnabled: false,
      homeSliderOrder: 0,
      promoSliderEnabled: false,
      promoSliderOrder: 0,
      featureSectionEnabled: false,
      featureSectionOrder: 0,
      isNewArrival: mapping.isNewArrival,
      isBestSeller: mapping.isBestSeller,
      isFeaturedLabel: mapping.isFeaturedLabel,
      catalogBadge: trimOrNull(mapping.catalogBadge) ?? "ERP Synced",
      promoBadge: trimOrNull(mapping.promoBadge),
      promoTitle: null,
      promoSubtitle: null,
      promoCtaLabel: null,
      fabric: null,
      fit: null,
      sleeve: null,
      occasion: null,
      shippingNote: trimOrNull(mapping.shippingNote) ?? "Projected from Frappe item snapshot.",
      shippingCharge: null,
      handlingCharge: null,
      isActive: true,
    },
    tags: tagNames.map((nameEntry) => ({
      name: nameEntry,
      isActive: true,
    })),
    reviews: [],
  })
}

export async function getFrappeItemProductMapping(
  database: Kysely<unknown>,
  user: AuthUser,
  item: FrappeItem
) {
  assertFrappeViewer(user)

  const mapping = await readResolvedItemProductMapping(database, item)
  const targetProduct = await resolveTargetCoreProductSummary(database, item, mapping)
  const draftPayload = buildItemProductProjectionDraft(item, mapping)

  return frappeItemProductMappingResponseSchema.parse({
    item,
    mapping,
    draft: {
      ...draftPayload,
      tagNames: draftPayload.tags.map((entry) => entry.name),
      catalogBadge: draftPayload.storefront?.catalogBadge ?? null,
      promoBadge: draftPayload.storefront?.promoBadge ?? null,
      shippingNote: draftPayload.storefront?.shippingNote ?? null,
    },
    targetProduct,
  })
}

export async function upsertFrappeItemProductMapping(
  database: Kysely<unknown>,
  user: AuthUser,
  item: FrappeItem,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsedPayload = frappeItemProductMappingUpsertPayloadSchema.parse(payload)
  const mappings = await readMappings(database)
  const timestamp = new Date().toISOString()
  const nextRecord = frappeItemProductMappingSchema.parse({
    ...(mappings.find((entry) => entry.itemId === item.id) ?? createDefaultItemProductMapping(item)),
    ...parsedPayload,
    itemId: item.id,
    itemCode: item.itemCode,
    updatedAt: timestamp,
  })
  const nextMappings = [
    ...mappings.filter((entry) => entry.itemId !== item.id),
    nextRecord,
  ].sort((left, right) => left.itemCode.localeCompare(right.itemCode))

  await writeMappings(database, nextMappings)

  return getFrappeItemProductMapping(database, user, item)
}
