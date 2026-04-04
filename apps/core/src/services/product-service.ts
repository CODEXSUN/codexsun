import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  productListResponseSchema,
  productResponseSchema,
  productSchema,
  productUpsertPayloadSchema,
  type Product,
  type ProductListResponse,
  type ProductResponse,
  type ProductUpsertPayload,
} from "../../shared/index.js"

import { coreTableNames } from "../../database/table-names.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function readProducts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Product>(database, coreTableNames.products)

  return items
    .map((product) =>
      productSchema.parse({
        ...product,
        code:
          typeof (product as { code?: unknown }).code === "string" &&
          (product as { code?: string }).code?.trim()
            ? (product as { code: string }).code
            : product.sku,
      })
    )
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function writeProducts(database: Kysely<unknown>, products: Product[]) {
  await replaceJsonStoreRecords(
    database,
    coreTableNames.products,
    products.map((product, index) => ({
      id: product.id,
      moduleKey: "products",
      sortOrder: index + 1,
      payload: product,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))
  )
}

function normalizeOptionalString(value: string | null | undefined) {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed && trimmed !== "-" ? trimmed : null
}

function normalizeRequiredString(value: string | null | undefined, fallback: string) {
  return normalizeOptionalString(value) ?? fallback
}

function resolveLinkId(
  directId: string | null | undefined,
  clientKey: string | null | undefined,
  idMap: Map<string, string>
) {
  if (clientKey && idMap.has(clientKey)) {
    return idMap.get(clientKey) ?? null
  }

  if (directId && idMap.has(directId)) {
    return idMap.get(directId) ?? null
  }

  return normalizeOptionalString(directId)
}

function buildProductRecord(payload: ProductUpsertPayload, existing?: Product) {
  const timestamp = new Date().toISOString()
  const productId = existing?.id ?? `product:${randomUUID()}`
  const productUuid = existing?.uuid ?? randomUUID()
  const effectiveSlug = slugify(normalizeRequiredString(payload.slug, payload.name))
  const effectiveCode = normalizeRequiredString(payload.code, payload.sku)
  const storefront = payload.storefront
    ? {
        id: existing?.storefront?.id ?? `product-storefront:${randomUUID()}`,
        productId,
        department: payload.storefront.department,
        homeSliderEnabled: payload.storefront.homeSliderEnabled,
        homeSliderOrder: payload.storefront.homeSliderOrder,
        promoSliderEnabled: payload.storefront.promoSliderEnabled,
        promoSliderOrder: payload.storefront.promoSliderOrder,
        featureSectionEnabled: payload.storefront.featureSectionEnabled,
        featureSectionOrder: payload.storefront.featureSectionOrder,
        isNewArrival: payload.storefront.isNewArrival,
        isBestSeller: payload.storefront.isBestSeller,
        isFeaturedLabel: payload.storefront.isFeaturedLabel,
        catalogBadge: normalizeOptionalString(payload.storefront.catalogBadge),
        fabric: normalizeOptionalString(payload.storefront.fabric),
        fit: normalizeOptionalString(payload.storefront.fit),
        sleeve: normalizeOptionalString(payload.storefront.sleeve),
        occasion: normalizeOptionalString(payload.storefront.occasion),
        shippingNote: normalizeOptionalString(payload.storefront.shippingNote),
        isActive: payload.storefront.isActive,
        createdAt: existing?.storefront?.createdAt ?? timestamp,
        updatedAt: timestamp,
      }
    : null

  const images = payload.images.map((item, index) => ({
    id: existing?.images[index]?.id ?? `product-image:${randomUUID()}`,
    productId,
    imageUrl: item.imageUrl,
    isPrimary: item.isPrimary,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    createdAt: existing?.images[index]?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }))

  const attributeIdByKey = new Map<string, string>()
  const attributes = payload.attributes.map((item, index) => {
    const clientKey =
      normalizeOptionalString(item.clientKey) ??
      existing?.attributes[index]?.id ??
      `product-attribute:${randomUUID()}`
    const attributeId =
      existing?.attributes.find((attribute) => attribute.id === clientKey)?.id ??
      existing?.attributes[index]?.id ??
      `product-attribute:${randomUUID()}`

    attributeIdByKey.set(clientKey, attributeId)
    attributeIdByKey.set(attributeId, attributeId)

    return {
      id: attributeId,
      productId,
      name: item.name,
      isActive: item.isActive,
      createdAt:
        existing?.attributes.find((attribute) => attribute.id === attributeId)?.createdAt ??
        existing?.attributes[index]?.createdAt ??
        timestamp,
      updatedAt: timestamp,
    }
  })

  const variantIdByKey = new Map<string, string>()
  const variants = payload.variants.map((item, variantIndex) => {
    const clientKey =
      normalizeOptionalString(item.clientKey) ??
      existing?.variants[variantIndex]?.id ??
      `product-variant:${randomUUID()}`
    const variantId =
      existing?.variants.find((variant) => variant.id === clientKey)?.id ??
      existing?.variants[variantIndex]?.id ??
      `product-variant:${randomUUID()}`

    variantIdByKey.set(clientKey, variantId)
    variantIdByKey.set(variantId, variantId)

    return {
      id: variantId,
      productId,
      sku: item.sku,
      variantName: item.variantName,
      price: item.price,
      costPrice: item.costPrice,
      stockQuantity: item.stockQuantity,
      openingStock: item.openingStock,
      weight: item.weight,
      barcode: normalizeOptionalString(item.barcode),
      isActive: item.isActive,
      createdAt: existing?.variants[variantIndex]?.createdAt ?? timestamp,
      updatedAt: timestamp,
      images: item.images.map((image, imageIndex) => ({
        id:
          existing?.variants[variantIndex]?.images[imageIndex]?.id ??
          `product-variant-image:${randomUUID()}`,
        variantId,
        imageUrl: image.imageUrl,
        isPrimary: image.isPrimary,
        isActive: image.isActive,
        createdAt:
          existing?.variants[variantIndex]?.images[imageIndex]?.createdAt ?? timestamp,
        updatedAt: timestamp,
      })),
      attributes: item.attributes.map((attribute, attributeIndex) => ({
        id:
          existing?.variants[variantIndex]?.attributes[attributeIndex]?.id ??
          `product-variant-attribute:${randomUUID()}`,
        variantId,
        attributeName: attribute.attributeName,
        attributeValue: attribute.attributeValue,
        isActive: attribute.isActive,
        createdAt:
          existing?.variants[variantIndex]?.attributes[attributeIndex]?.createdAt ??
          timestamp,
        updatedAt: timestamp,
      })),
    }
  })
  const attributeValueIdByKey = new Map<string, string>()
  const attributeValues = payload.attributeValues.map((item, index) => {
    const clientKey =
      normalizeOptionalString(item.clientKey) ??
      existing?.attributeValues[index]?.id ??
      `product-attribute-value:${randomUUID()}`
    const attributeValueId =
      existing?.attributeValues.find((value) => value.id === clientKey)?.id ??
      existing?.attributeValues[index]?.id ??
      `product-attribute-value:${randomUUID()}`
    const attributeId =
      resolveLinkId(item.attributeId, item.attributeClientKey, attributeIdByKey) ??
      attributes[0]?.id ??
      ""

    attributeValueIdByKey.set(clientKey, attributeValueId)
    attributeValueIdByKey.set(attributeValueId, attributeValueId)

    return {
      id: attributeValueId,
      productId,
      attributeId,
      value: item.value,
      isActive: item.isActive,
      createdAt:
        existing?.attributeValues.find((value) => value.id === attributeValueId)?.createdAt ??
        existing?.attributeValues[index]?.createdAt ??
        timestamp,
      updatedAt: timestamp,
    }
  })

  return productSchema.parse({
    id: productId,
    uuid: productUuid,
    code: effectiveCode,
    name: payload.name,
    slug: effectiveSlug || slugify(payload.name),
    description: normalizeOptionalString(payload.description),
    shortDescription: normalizeOptionalString(payload.shortDescription),
    brandId: payload.brandId,
    brandName: normalizeOptionalString(payload.brandName),
    categoryId: payload.categoryId,
    categoryName: normalizeOptionalString(payload.categoryName),
    productGroupId: payload.productGroupId,
    productGroupName: normalizeOptionalString(payload.productGroupName),
    productTypeId: payload.productTypeId,
    productTypeName: normalizeOptionalString(payload.productTypeName),
    unitId: payload.unitId,
    hsnCodeId: payload.hsnCodeId,
    styleId: payload.styleId,
    sku: payload.sku,
    hasVariants: payload.hasVariants,
    basePrice: payload.basePrice,
    costPrice: payload.costPrice,
    taxId: payload.taxId,
    isFeatured: payload.isFeatured,
    isActive: payload.isActive,
    storefrontDepartment: storefront?.department ?? payload.storefrontDepartment,
    homeSliderEnabled: storefront?.homeSliderEnabled ?? payload.homeSliderEnabled,
    promoSliderEnabled: storefront?.promoSliderEnabled ?? payload.promoSliderEnabled,
    featureSectionEnabled:
      storefront?.featureSectionEnabled ?? payload.featureSectionEnabled,
    isNewArrival: storefront?.isNewArrival ?? payload.isNewArrival,
    isBestSeller: storefront?.isBestSeller ?? payload.isBestSeller,
    isFeaturedLabel: storefront?.isFeaturedLabel ?? payload.isFeaturedLabel,
    primaryImageUrl: images.find((image) => image.isPrimary)?.imageUrl ?? images[0]?.imageUrl ?? null,
    variantCount: variants.length,
    tagCount: payload.tags.length,
    tagNames: payload.tags.map((tag) => tag.name),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    images,
    variants,
    prices: payload.prices.map((item, index) => ({
      id: existing?.prices[index]?.id ?? `product-price:${randomUUID()}`,
      productId,
      variantId: resolveLinkId(item.variantId, item.variantClientKey, variantIdByKey),
      mrp: item.mrp,
      sellingPrice: item.sellingPrice,
      costPrice: item.costPrice,
      isActive: item.isActive,
      createdAt: existing?.prices[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    discounts: payload.discounts.map((item, index) => ({
      id: existing?.discounts[index]?.id ?? `product-discount:${randomUUID()}`,
      productId,
      variantId: resolveLinkId(item.variantId, item.variantClientKey, variantIdByKey),
      discountType: item.discountType,
      discountValue: item.discountValue,
      startDate: normalizeOptionalString(item.startDate),
      endDate: normalizeOptionalString(item.endDate),
      isActive: item.isActive,
      createdAt: existing?.discounts[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    offers: payload.offers.map((item, index) => ({
      id: existing?.offers[index]?.id ?? `product-offer:${randomUUID()}`,
      productId,
      title: item.title,
      description: normalizeOptionalString(item.description),
      offerPrice: item.offerPrice,
      startDate: normalizeOptionalString(item.startDate),
      endDate: normalizeOptionalString(item.endDate),
      isActive: item.isActive,
      createdAt: existing?.offers[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    attributes,
    attributeValues,
    variantMap: payload.variantMap.map((item, index) => ({
      id: existing?.variantMap[index]?.id ?? `product-variant-map:${randomUUID()}`,
      productId,
      attributeId:
        resolveLinkId(item.attributeId, item.attributeClientKey, attributeIdByKey) ??
        attributes[0]?.id ??
        "",
      valueId:
        resolveLinkId(item.valueId, item.valueClientKey, attributeValueIdByKey) ??
        attributeValues[0]?.id ??
        "",
      isActive: item.isActive,
      createdAt: existing?.variantMap[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    stockItems: payload.stockItems.map((item, index) => ({
      id: existing?.stockItems[index]?.id ?? `product-stock-item:${randomUUID()}`,
      productId,
      variantId: resolveLinkId(item.variantId, item.variantClientKey, variantIdByKey),
      warehouseId: item.warehouseId,
      quantity: item.quantity,
      reservedQuantity: item.reservedQuantity,
      isActive: item.isActive,
      createdAt: existing?.stockItems[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    stockMovements: payload.stockMovements.map((item, index) => ({
      id:
        existing?.stockMovements[index]?.id ??
        `product-stock-movement:${randomUUID()}`,
      productId,
      variantId: resolveLinkId(item.variantId, item.variantClientKey, variantIdByKey),
      warehouseId: item.warehouseId,
      movementType: item.movementType,
      quantity: item.quantity,
      referenceType: normalizeOptionalString(item.referenceType),
      referenceId: normalizeOptionalString(item.referenceId),
      movementAt: item.movementAt,
      isActive: item.isActive,
      createdAt: existing?.stockMovements[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    seo: payload.seo
      ? {
          id: existing?.seo?.id ?? `product-seo:${randomUUID()}`,
          productId,
          metaTitle: normalizeOptionalString(payload.seo.metaTitle),
          metaDescription: normalizeOptionalString(payload.seo.metaDescription),
          metaKeywords: normalizeOptionalString(payload.seo.metaKeywords),
          isActive: payload.seo.isActive,
          createdAt: existing?.seo?.createdAt ?? timestamp,
          updatedAt: timestamp,
        }
      : null,
    storefront,
    tags: payload.tags.map((item, index) => ({
      id: existing?.tags[index]?.id ?? `product-tag:${randomUUID()}`,
      name: item.name,
      isActive: item.isActive,
      createdAt: existing?.tags[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    reviews: payload.reviews.map((item, index) => ({
      id: existing?.reviews[index]?.id ?? `product-review:${randomUUID()}`,
      productId,
      userId: item.userId,
      rating: item.rating,
      review: normalizeOptionalString(item.review),
      reviewDate: item.reviewDate,
      isActive: item.isActive,
      createdAt: existing?.reviews[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
  })
}

export async function listProducts(
  database: Kysely<unknown>
): Promise<ProductListResponse> {
  return productListResponseSchema.parse({
    items: await readProducts(database),
  })
}

export async function getProduct(
  database: Kysely<unknown>,
  _user: AuthUser,
  productId: string
): Promise<ProductResponse> {
  const products = await readProducts(database)
  const product = products.find((item) => item.id === productId)

  if (!product) {
    throw new ApplicationError("Product could not be found.", { productId }, 404)
  }

  return productResponseSchema.parse({
    item: product,
  })
}

export async function createProduct(
  database: Kysely<unknown>,
  _user: AuthUser,
  payload: unknown
): Promise<ProductResponse> {
  const parsedPayload = productUpsertPayloadSchema.parse(payload)
  const products = await readProducts(database)
  const record = buildProductRecord(parsedPayload)

  if (
    products.some(
      (product) => product.sku.trim().toLowerCase() === record.sku.trim().toLowerCase()
    )
  ) {
    throw new ApplicationError("Product SKU already exists.", { sku: record.sku }, 409)
  }

  if (
    products.some(
      (product) =>
        product.code.trim().toLowerCase() === record.code.trim().toLowerCase()
    )
  ) {
    throw new ApplicationError("Product code already exists.", { code: record.code }, 409)
  }

  await writeProducts(database, [...products, record])

  return productResponseSchema.parse({
    item: record,
  })
}

export async function updateProduct(
  database: Kysely<unknown>,
  _user: AuthUser,
  productId: string,
  payload: unknown
): Promise<ProductResponse> {
  const parsedPayload = productUpsertPayloadSchema.parse(payload)
  const products = await readProducts(database)
  const existing = products.find((item) => item.id === productId)

  if (!existing) {
    throw new ApplicationError("Product could not be found.", { productId }, 404)
  }

  const updated = buildProductRecord(parsedPayload, existing)

  if (
    products.some(
      (product) =>
        product.id !== productId &&
        product.sku.trim().toLowerCase() === updated.sku.trim().toLowerCase()
    )
  ) {
    throw new ApplicationError("Product SKU already exists.", { sku: updated.sku }, 409)
  }

  if (
    products.some(
      (product) =>
        product.id !== productId &&
        product.code.trim().toLowerCase() === updated.code.trim().toLowerCase()
    )
  ) {
    throw new ApplicationError("Product code already exists.", { code: updated.code }, 409)
  }

  await writeProducts(
    database,
    products.map((item) => (item.id === productId ? updated : item))
  )

  return productResponseSchema.parse({
    item: updated,
  })
}

export async function deleteProduct(
  database: Kysely<unknown>,
  _user: AuthUser,
  productId: string
) {
  const products = await readProducts(database)
  const nextProducts = products.filter((item) => item.id !== productId)

  if (nextProducts.length === products.length) {
    throw new ApplicationError("Product could not be found.", { productId }, 404)
  }

  await writeProducts(database, nextProducts)

  return {
    deleted: true as const,
    id: productId,
  }
}
