import type { Kysely } from "kysely"

import {
  listJsonStorePayloads,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { coreTableNames } from "../../../core/database/table-names.js"
import { listCommonModuleItems } from "../../../core/src/services/common-module-service.js"
import { productSchema, type Product } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  storefrontCatalogQuerySchema,
  storefrontCatalogResponseSchema,
  storefrontLandingResponseSchema,
  storefrontProductResponseSchema,
  type StorefrontCategorySummary,
  type StorefrontProductCard,
  type StorefrontProductResponse,
} from "../../shared/index.js"
import { getStorefrontSettings } from "./storefront-settings-service.js"

import { ecommerceTableNames } from "../../database/table-names.js"

function resolveProductPrice(product: {
  basePrice: number
  prices: { sellingPrice: number; mrp: number; isActive: boolean }[]
}) {
  const activePrice = product.prices.find((item) => item.isActive) ?? product.prices[0]
  const sellingPrice = activePrice?.sellingPrice ?? product.basePrice
  const mrp = activePrice?.mrp ?? Math.max(sellingPrice, product.basePrice)
  const discountPercent =
    mrp > sellingPrice
      ? Math.max(0, Math.round(((mrp - sellingPrice) / mrp) * 100))
      : 0

  return { sellingPrice, mrp, discountPercent }
}

function resolveAvailableQuantity(product: {
  stockItems: { quantity: number; reservedQuantity: number; isActive: boolean }[]
}) {
  return product.stockItems
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + Math.max(0, item.quantity - item.reservedQuantity), 0)
}

function toStorefrontProductCard(
  product: Product
): StorefrontProductCard {
  const { sellingPrice, mrp, discountPercent } = resolveProductPrice(product)

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brandName: product.brandName,
    categoryName: product.categoryName,
    department: product.storefrontDepartment,
    badge: product.storefront?.catalogBadge ?? null,
    shortDescription: product.shortDescription,
    primaryImageUrl: product.primaryImageUrl,
    sellingPrice,
    mrp,
    discountPercent,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    isFeaturedLabel: product.isFeaturedLabel,
    availableQuantity: resolveAvailableQuantity(product),
    tagNames: product.tagNames,
  }
}

async function readCoreProducts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Product>(database, coreTableNames.products)

  return items.map((item) => productSchema.parse(item))
}

function toCategorySlug(item: Record<string, unknown>) {
  const base = typeof item.code === "string" && item.code.trim()
    ? item.code
    : String(item.name ?? "")

  return base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

async function listStorefrontCategories(
  database: Kysely<unknown>,
  productCards: StorefrontProductCard[]
) {
  const categories = await listCommonModuleItems(database, "productCategories")

  return categories.items
    .filter((item) => item.id !== "1" && item.show_on_storefront_catalog)
    .sort(
      (left, right) =>
        Number(left.position_order ?? 0) - Number(right.position_order ?? 0) ||
        String(left.name ?? "").localeCompare(String(right.name ?? ""))
    )
    .map((item) => ({
      id: item.id,
      slug: toCategorySlug(item),
      name: String(item.name ?? ""),
      description:
        typeof item.description === "string" && item.description.trim()
          ? item.description
          : null,
      imageUrl:
        typeof item.image === "string" && item.image.trim() && item.image !== "-"
          ? item.image
          : null,
      showInTopMenu: Boolean(item.show_on_storefront_top_menu),
      positionOrder: Number(item.position_order ?? 0),
      productCount: productCards.filter((product) => product.categoryName === item.name).length,
      href: `/shop/catalog?category=${encodeURIComponent(String(item.name ?? ""))}`,
    })) satisfies StorefrontCategorySummary[]
}

export async function getStorefrontLanding(database: Kysely<unknown>) {
  const settings = await getStorefrontSettings(database)
  const products = await readCoreProducts(database)
  const items = products
    .filter((item) => item.isActive)
    .map(toStorefrontProductCard)

  const homeSliderItems = products
    .filter((item) => item.isActive && item.homeSliderEnabled)
    .sort(
      (left, right) =>
        (left.storefront?.homeSliderOrder ?? 0) -
          (right.storefront?.homeSliderOrder ?? 0) ||
        left.name.localeCompare(right.name)
    )
    .map(toStorefrontProductCard)
    .slice(0, 4)
  const featured = items.filter((item) => item.isFeaturedLabel).slice(0, 4)
  const newArrivals = items.filter((item) => item.isNewArrival).slice(0, 8)
  const bestSellers = items.filter((item) => item.isBestSeller).slice(0, 6)
  const categories = await listStorefrontCategories(database, items)

  return storefrontLandingResponseSchema.parse({
    settings,
    featured:
      homeSliderItems.length > 0
        ? homeSliderItems
        : featured.length > 0
          ? featured
          : items.slice(0, 4),
    newArrivals: newArrivals.length > 0 ? newArrivals : items.slice(0, 8),
    bestSellers: bestSellers.length > 0 ? bestSellers : items.slice(0, 6),
    categories: categories.filter((item) => item.productCount > 0),
  })
}

export async function getStorefrontCatalog(database: Kysely<unknown>, query: unknown) {
  const settings = await getStorefrontSettings(database)
  const filters = storefrontCatalogQuerySchema.parse(query ?? {})
  const products = await readCoreProducts(database)
  const categories = await listStorefrontCategories(
    database,
    products.filter((item) => item.isActive).map(toStorefrontProductCard)
  )
  let items = products.filter((item) => item.isActive).map(toStorefrontProductCard)

  if (filters.search) {
    const search = filters.search.toLowerCase()
    items = items.filter((item) =>
      [item.name, item.brandName, item.categoryName, item.department, item.shortDescription]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    )
  }

  if (filters.category) {
    const category = filters.category.toLowerCase()
    items = items.filter((item) => item.categoryName?.toLowerCase() === category)
  }

  if (filters.department) {
    const department = filters.department.toLowerCase()
    items = items.filter((item) => item.department?.toLowerCase() === department)
  }

  if (filters.tag) {
    const tag = filters.tag.toLowerCase()
    items = items.filter((item) => item.tagNames.some((entry) => entry.toLowerCase() === tag))
  }

  switch (filters.sort) {
    case "latest":
      items.sort(
        (left, right) =>
          Number(right.isNewArrival) - Number(left.isNewArrival) ||
          left.name.localeCompare(right.name)
      )
      break
    case "price-asc":
      items.sort(
        (left, right) =>
          left.sellingPrice - right.sellingPrice || left.name.localeCompare(right.name)
      )
      break
    case "price-desc":
      items.sort(
        (left, right) =>
          right.sellingPrice - left.sellingPrice || left.name.localeCompare(right.name)
      )
      break
    default:
      items.sort(
        (left, right) =>
          Number(right.isFeaturedLabel) - Number(left.isFeaturedLabel) ||
          Number(right.isBestSeller) - Number(left.isBestSeller) ||
          left.name.localeCompare(right.name)
      )
  }

  return storefrontCatalogResponseSchema.parse({
    settings,
    filters: {
      search: filters.search?.trim() ?? "",
      category: filters.category?.trim() ?? "",
      department: filters.department?.trim() ?? "",
      tag: filters.tag?.trim() ?? "",
      sort: filters.sort ?? "featured",
    },
    items,
    availableCategories: categories.filter((item) => item.productCount > 0),
    availableDepartments: Array.from(
      new Set(
        products
          .map((item) => item.storefrontDepartment)
          .filter(
            (
              value
            ): value is NonNullable<Product["storefrontDepartment"]> =>
              typeof value === "string" && value.length > 0
          )
      )
    ),
    availableTags: Array.from(
      new Set(products.flatMap((item) => item.tagNames))
    ).sort((left, right) => left.localeCompare(right)),
  })
}

export async function getStorefrontProduct(
  database: Kysely<unknown>,
  query: { id?: string | null; slug?: string | null }
): Promise<StorefrontProductResponse> {
  const settings = await getStorefrontSettings(database)
  const products = await readCoreProducts(database)
  const product = products.find(
    (item) =>
      item.isActive &&
      ((query.id && item.id === query.id) || (query.slug && item.slug === query.slug))
  )

  if (!product) {
    throw new ApplicationError("Storefront product could not be found.", query, 404)
  }

  const relatedItems = products
    .filter(
      (item) =>
        item.id !== product.id &&
        item.isActive &&
        (item.categoryName === product.categoryName ||
          item.brandName === product.brandName ||
          item.storefrontDepartment === product.storefrontDepartment)
    )
    .slice(0, 4)
    .map(toStorefrontProductCard)

  const card = toStorefrontProductCard(product)
  const detail = {
    ...card,
    description: product.description,
    images:
      product.images.length > 0
        ? product.images
            .filter((item) => item.isActive)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.imageUrl)
        : card.primaryImageUrl
          ? [card.primaryImageUrl]
          : [],
    fits: product.storefront?.fit ? [product.storefront.fit] : [],
    fabrics: product.storefront?.fabric ? [product.storefront.fabric] : [],
    shippingNote: product.storefront?.shippingNote ?? null,
    reviewCount: product.reviews.length,
    averageRating:
      product.reviews.length > 0
        ? Number(
            (
              product.reviews.reduce((sum, item) => sum + item.rating, 0) /
              product.reviews.length
            ).toFixed(1)
          )
        : 0,
  }

  return storefrontProductResponseSchema.parse({
    settings,
    item: detail,
    relatedItems,
  })
}

export async function listStorefrontOrdersRaw(database: Kysely<unknown>) {
  return listJsonStorePayloads<unknown>(database, ecommerceTableNames.orders)
}
