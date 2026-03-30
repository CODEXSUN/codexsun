import type { Kysely } from "kysely"

import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import {
  productSchema,
  storefrontCatalogResponseSchema,
  type Product,
  type StorefrontBrand,
  type StorefrontCatalogResponse,
  type StorefrontCategory,
  type StorefrontDepartment,
  type StorefrontProduct,
  type StorefrontReview,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function averageRating(ratings: number[]) {
  if (ratings.length === 0) {
    return 0
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0)
  return Number((total / ratings.length).toFixed(1))
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function resolveDepartment(product: Product): StorefrontDepartment {
  return (
    product.storefront?.department ??
    product.storefrontDepartment ??
    "accessories"
  )
}

function toStorefrontProduct(product: Product): StorefrontProduct {
  const department = resolveDepartment(product)
  const primaryPrice = product.prices[0] ?? null
  const sellingPrice = primaryPrice?.sellingPrice ?? product.basePrice
  const compareAtPrice =
    primaryPrice && primaryPrice.mrp > sellingPrice ? primaryPrice.mrp : null
  const inventory = product.stockItems.reduce(
    (total, item) => total + Math.max(0, item.quantity - item.reservedQuantity),
    0
  )
  const colors = uniqueStrings(
    product.variants.flatMap((variant) =>
      variant.attributes
        .filter((attribute) => attribute.attributeName.toLowerCase() === "color")
        .map((attribute) => attribute.attributeValue)
    )
  ).map((name) => ({
    name,
    swatch: null,
  }))
  const sizes = uniqueStrings(
    product.variants.flatMap((variant) =>
      variant.attributes
        .filter((attribute) => attribute.attributeName.toLowerCase() === "size")
        .map((attribute) => attribute.attributeValue)
    )
  )
  const brand = product.brandName ?? "Unbranded"
  const categoryName = product.categoryName ?? "Catalog"

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    brand,
    brandSlug: slugify(brand) || "brand",
    categorySlug: slugify(categoryName) || "catalog",
    categoryName,
    department,
    price: sellingPrice,
    compareAtPrice,
    rating: averageRating(product.reviews.map((review) => review.rating)),
    reviewCount: product.reviews.length,
    inventory,
    homeSlider: product.storefront?.homeSliderEnabled ?? product.homeSliderEnabled,
    homeSliderOrder: product.storefront?.homeSliderOrder ?? 0,
    promoSlider: product.storefront?.promoSliderEnabled ?? product.promoSliderEnabled,
    promoSliderOrder: product.storefront?.promoSliderOrder ?? 0,
    featureSection:
      product.storefront?.featureSectionEnabled ?? product.featureSectionEnabled,
    featureSectionOrder: product.storefront?.featureSectionOrder ?? 0,
    featured: product.isFeatured,
    newArrival: product.storefront?.isNewArrival ?? product.isNewArrival,
    bestseller: product.storefront?.isBestSeller ?? product.isBestSeller,
    featuredLabel:
      product.storefront?.isFeaturedLabel ?? product.isFeaturedLabel,
    catalogBadge: product.storefront?.catalogBadge ?? null,
    images: product.images
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((image) => image.imageUrl),
    colors,
    sizes,
    fabric: product.storefront?.fabric ?? null,
    fit: product.storefront?.fit ?? null,
    sleeve: product.storefront?.sleeve ?? null,
    occasion: product.storefront?.occasion ?? null,
    shortDescription: product.shortDescription,
    description: product.description,
    shippingNote: product.storefront?.shippingNote ?? null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export async function listProductRecords(
  database: Kysely<unknown>
): Promise<Product[]> {
  const items = await listJsonStorePayloads<Product>(
    database,
    ecommerceTableNames.products
  )

  return items.map((product) => productSchema.parse(product))
}

export async function findProductRecordBySku(
  database: Kysely<unknown>,
  sku: string
) {
  const normalizedSku = sku.trim().toLowerCase()
  const products = await listProductRecords(database)

  return (
    products.find((product) => product.sku.trim().toLowerCase() === normalizedSku) ??
    null
  )
}

export function buildStorefrontCatalog(
  products: Product[]
): StorefrontCatalogResponse {
  const activeProducts = products.filter((product) => product.isActive)
  const storefrontProducts = activeProducts.map(toStorefrontProduct)

  const brands = Array.from(
    storefrontProducts.reduce((map, product) => {
      const current = map.get(product.brand) ?? {
        id: product.brandSlug,
        name: product.brand,
        slug: product.brandSlug,
        description: null,
        image: null,
        productCount: 0,
        featuredLabel: false,
      }

      current.productCount += 1
      current.featuredLabel = current.featuredLabel || product.featuredLabel
      map.set(product.brand, current)
      return map
    }, new Map<string, StorefrontBrand>()).values()
  ).sort((left, right) => left.name.localeCompare(right.name))

  const categories = Array.from(
    storefrontProducts.reduce((map, product) => {
      const current = map.get(product.categorySlug) ?? {
        id: product.categorySlug,
        name: product.categoryName,
        slug: product.categorySlug,
        department: product.department,
        description: `Catalog items in ${product.categoryName}.`,
        image: product.images[0] ?? null,
        menuImage: product.images[0] ?? null,
        positionOrder: map.size + 1,
        showInTopMenu: true,
        showInCatalogSection: true,
        productCount: 0,
      }

      current.productCount += 1
      map.set(product.categorySlug, current)
      return map
    }, new Map<string, StorefrontCategory>()).values()
  ).sort((left, right) => left.positionOrder - right.positionOrder)

  const reviews: StorefrontReview[] = activeProducts.flatMap((product) =>
    product.reviews.map((review) => ({
      id: review.id,
      productId: product.id,
      username: review.userId ?? "Anonymous",
      rating: review.rating,
      title: null,
      review: review.review,
      createdAt: review.reviewDate,
      verifiedPurchase: Boolean(review.userId),
    }))
  )

  return storefrontCatalogResponseSchema.parse({
    brands,
    categories,
    products: storefrontProducts,
    reviews,
  })
}

export async function replaceProductRecords(
  database: Kysely<unknown>,
  products: Product[]
) {
  const normalizedProducts = products
    .map((product) => productSchema.parse(product))
    .sort((left, right) => left.name.localeCompare(right.name))
  const storefrontCatalog = buildStorefrontCatalog(normalizedProducts)

  await replaceJsonStoreRecords(
    database,
    ecommerceTableNames.products,
    normalizedProducts.map((product, index) => ({
      id: product.id,
      moduleKey: "products",
      sortOrder: index + 1,
      payload: product,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))
  )

  await replaceJsonStoreRecords(database, ecommerceTableNames.storefrontCatalogs, [
    {
      id: "storefront-catalog:active",
      moduleKey: "storefront",
      sortOrder: 1,
      payload: storefrontCatalog,
    },
  ])

  return normalizedProducts
}
