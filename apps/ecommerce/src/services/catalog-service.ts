import type { Kysely } from "kysely"

import {
  listJsonStorePayloads,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { listCommonModuleItems } from "../../../core/src/services/common-module-service.js"
import { type Product } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  storefrontCatalogQuerySchema,
  storefrontCatalogResponseSchema,
  storefrontLegalPageResponseSchema,
  storefrontLandingResponseSchema,
  storefrontProductResponseSchema,
  storefrontBrandDiscoveryCardSchema,
  type StorefrontCategorySummary,
  type StorefrontBrandDiscoveryCard,
  type StorefrontLegalPage,
  type StorefrontProductCard,
  type StorefrontProductDetail,
  type StorefrontProductResponse,
} from "../../shared/index.js"
import { getStorefrontSettings } from "./storefront-settings-service.js"
import {
  getProjectedStorefrontProduct,
  readProjectedStorefrontProducts,
} from "./projected-product-service.js"

import { ecommerceTableNames } from "../../database/table-names.js"

export function resolveProductPrice(product: {
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

export function resolveAvailableQuantity(product: {
  stockItems: { quantity: number; reservedQuantity: number; isActive: boolean }[]
}) {
  return product.stockItems
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + Math.max(0, item.quantity - item.reservedQuantity), 0)
}

export function toStorefrontProductCard(
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
    promoBadge: product.storefront?.promoBadge ?? null,
    promoTitle: product.storefront?.promoTitle ?? null,
    promoSubtitle: product.storefront?.promoSubtitle ?? null,
    promoCtaLabel: product.storefront?.promoCtaLabel ?? null,
    shortDescription: product.shortDescription,
    primaryImageUrl: product.primaryImageUrl,
    sellingPrice,
    mrp,
    discountPercent,
    promoSliderEnabled: product.promoSliderEnabled,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    isFeaturedLabel: product.isFeaturedLabel,
    shippingCharge: product.storefront?.shippingCharge ?? null,
    handlingCharge: product.storefront?.handlingCharge ?? null,
    availableQuantity: resolveAvailableQuantity(product),
    tagNames: product.tagNames,
  }
}

function createSpecificationGroup(
  id: string,
  title: string,
  summary: string | null,
  items: Array<{ label: string; value: string | null | undefined }>
): StorefrontProductDetail["specificationGroups"][number] | null {
  const normalizedItems = items
    .map((item, index) => ({
      id: `${id}:${index + 1}`,
      label: item.label,
      value: item.value?.trim() ?? "",
    }))
    .filter((item) => item.value.length > 0)

  if (normalizedItems.length === 0) {
    return null
  }

  return {
    id,
    title,
    summary,
    items: normalizedItems,
  }
}

function buildStorefrontProductSpecifications(
  product: Product,
  detailCard: StorefrontProductCard
) {
  const attributeValueMap = new Map(
    product.attributeValues
      .filter((item) => item.isActive)
      .map((item) => [item.attributeId, item.value])
  )

  const identityGroup = createSpecificationGroup(
    "identity",
    "Product identity",
    "Core catalog identifiers and merchandising placement.",
    [
      { label: "Brand", value: product.brandName },
      { label: "Category", value: product.categoryName },
      { label: "Department", value: product.storefrontDepartment },
      { label: "SKU", value: product.sku },
      { label: "Product code", value: product.code },
      { label: "Type", value: product.productTypeName },
      { label: "Group", value: product.productGroupName },
    ]
  )

  const merchandisingGroup = createSpecificationGroup(
    "merchandising",
    "Merchandising",
    "Storefront-specific presentation and style notes.",
    [
      { label: "Badge", value: detailCard.badge },
      { label: "Promo badge", value: detailCard.promoBadge },
      { label: "Fabric", value: product.storefront?.fabric },
      { label: "Fit", value: product.storefront?.fit },
      { label: "Sleeve", value: product.storefront?.sleeve },
      { label: "Occasion", value: product.storefront?.occasion },
      { label: "Tags", value: product.tagNames.join(", ") || null },
    ]
  )

  const pricingGroup = createSpecificationGroup(
    "pricing",
    "Pricing and fulfilment",
    "Commercial values, stock posture, and shipping notes.",
    [
      { label: "Selling price", value: `INR ${detailCard.sellingPrice.toFixed(2)}` },
      { label: "MRP", value: `INR ${detailCard.mrp.toFixed(2)}` },
      {
        label: "Discount",
        value: detailCard.discountPercent > 0 ? `${detailCard.discountPercent}%` : null,
      },
      { label: "Available quantity", value: String(detailCard.availableQuantity) },
      {
        label: "Shipping charge",
        value:
          detailCard.shippingCharge && detailCard.shippingCharge > 0
            ? `INR ${detailCard.shippingCharge.toFixed(2)}`
            : "Free",
      },
      {
        label: "Handling charge",
        value:
          detailCard.handlingCharge && detailCard.handlingCharge > 0
            ? `INR ${detailCard.handlingCharge.toFixed(2)}`
            : "None",
      },
      { label: "Shipping note", value: product.storefront?.shippingNote },
      {
        label: "Stock state",
        value: detailCard.availableQuantity > 0 ? "In stock" : "Out of stock",
      },
      {
        label: "Review snapshot",
        value:
          product.reviews.length > 0
            ? `${(
                product.reviews.reduce((sum, item) => sum + item.rating, 0) /
                product.reviews.length
              ).toFixed(1)} / 5 from ${product.reviews.length} reviews`
            : "No reviews yet",
      },
    ]
  )

  const configurationGroup = createSpecificationGroup(
    "configuration",
    "Configuration",
    "Structured attributes managed in the core product master.",
    product.attributes
      .filter((item) => item.isActive)
      .map((attribute) => ({
        label: attribute.name,
        value: attributeValueMap.get(attribute.id) ?? null,
      }))
  )

  const variantGroup = createSpecificationGroup(
    "variants",
    "Variants",
    "Available sellable options generated from the product master.",
    product.variants
      .filter((item) => item.isActive)
      .map((variant) => ({
        label: variant.variantName,
        value: [
          variant.attributes
            .map((attribute) => `${attribute.attributeName}: ${attribute.attributeValue}`)
            .join(", "),
          variant.stockQuantity > 0 ? `Stock ${variant.stockQuantity}` : "Out of stock",
        ]
          .filter((value) => value.length > 0)
          .join(" | "),
      }))
  )

  return [
    identityGroup,
    merchandisingGroup,
    pricingGroup,
    configurationGroup,
    variantGroup,
  ].filter(
    (
      group
    ): group is NonNullable<typeof group> => group !== null
  )
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

function isAllItemsCategory(item: Record<string, unknown>) {
  const code = typeof item.code === "string" ? item.code.trim().toLowerCase() : ""
  const name = typeof item.name === "string" ? item.name.trim().toLowerCase() : ""

  return code === "all-items" || name === "all items"
}

async function listStorefrontCategories(
  database: Kysely<unknown>,
  productCards: StorefrontProductCard[]
) {
  const categories = await listCommonModuleItems(database, "productCategories")

  return categories.items
    .filter(
      (item) =>
        item.id !== "1" &&
        (Boolean(item.show_on_storefront_catalog) || Boolean(item.show_on_storefront_top_menu))
    )
    .sort(
      (left, right) =>
        Number(left.position_order ?? 0) - Number(right.position_order ?? 0) ||
        String(left.name ?? "").localeCompare(String(right.name ?? ""))
    )
    .map((item) => {
      const isAllItems = isAllItemsCategory(item)

      return {
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
        href: isAllItems
          ? "/shop/catalog"
          : `/shop/catalog?category=${encodeURIComponent(String(item.name ?? ""))}`,
      }
    }) satisfies StorefrontCategorySummary[]
}

function listStorefrontBrands(products: Product[]): StorefrontBrandDiscoveryCard[] {
  const uniqueBrands = new Map<string, Product>()

  for (const product of products) {
    if (!product.isActive || !product.brandName || !product.primaryImageUrl) {
      continue
    }

    const key = product.brandName.trim().toLowerCase()
    if (!key || uniqueBrands.has(key)) {
      continue
    }

    uniqueBrands.set(key, product)
  }

  return Array.from(uniqueBrands.values())
    .sort((left, right) => (left.brandName ?? "").localeCompare(right.brandName ?? ""))
    .map((product) =>
      storefrontBrandDiscoveryCardSchema.parse({
        id: `brand-card:${product.brandId ?? product.id}`,
        brandName: product.brandName ?? "Brand",
        title: product.storefront?.promoTitle?.trim() || product.name,
        summary:
          product.shortDescription?.trim() ||
          product.categoryName?.trim() ||
          product.storefrontDepartment?.trim() ||
          "Explore the latest collection.",
        imageUrl: product.primaryImageUrl,
        href: `/shop/catalog?search=${encodeURIComponent(product.brandName ?? product.name)}`,
      })
    )
}

export async function getStorefrontLanding(database: Kysely<unknown>) {
  const settings = await getStorefrontSettings(database)
  const products = await readProjectedStorefrontProducts(database)
  const items = products
    .filter((item) => item.isActive)
    .map(toStorefrontProductCard)
  const featuredItemCount = Math.max(
    1,
    (settings.sections.featured.cardsPerRow ?? 3) *
      (settings.sections.featured.rowsToShow ?? 1)
  )
  const newArrivalItemCount = Math.max(
    1,
    (settings.sections.newArrivals.cardsPerRow ?? 3) *
      (settings.sections.newArrivals.rowsToShow ?? 1)
  )
  const bestSellerItemCount = Math.max(
    1,
    (settings.sections.bestSellers.cardsPerRow ?? 3) *
      (settings.sections.bestSellers.rowsToShow ?? 1)
  )

  const homeSliderItems = products
    .filter((item) => item.isActive && item.homeSliderEnabled)
    .sort(
      (left, right) =>
        (left.storefront?.homeSliderOrder ?? 0) -
          (right.storefront?.homeSliderOrder ?? 0) ||
        left.name.localeCompare(right.name)
    )
    .map(toStorefrontProductCard)
    .slice(0, Math.max(settings.homeSlider.slides.length, 1))
  const featured = items
    .filter((item) => item.isFeaturedLabel)
    .slice(0, featuredItemCount)
  const newArrivals = items.filter((item) => item.isNewArrival).slice(0, newArrivalItemCount)
  const bestSellers = items.filter((item) => item.isBestSeller).slice(0, bestSellerItemCount)
  const categories = await listStorefrontCategories(database, items)
  const brands = listStorefrontBrands(products)

  return storefrontLandingResponseSchema.parse({
    settings,
    featured:
      homeSliderItems.length > 0
        ? [
            ...homeSliderItems,
            ...featured.filter(
              (item) => !homeSliderItems.some((sliderItem) => sliderItem.id === item.id)
            ),
          ].slice(0, Math.max(featuredItemCount, homeSliderItems.length))
        : featured.length > 0
          ? featured
          : items.slice(0, featuredItemCount),
    newArrivals: newArrivals.length > 0 ? newArrivals : items.slice(0, newArrivalItemCount),
    bestSellers: bestSellers.length > 0 ? bestSellers : items.slice(0, bestSellerItemCount),
    categories: categories.filter(
      (item) =>
        item.showInTopMenu ||
        (item.productCount > 0 && item.slug !== "all-items")
    ),
    brands,
  })
}

export async function getStorefrontLegalPage(
  database: Kysely<unknown>,
  pageId: StorefrontLegalPage["id"]
) {
  const settings = await getStorefrontSettings(database)
  const item = settings.legalPages[pageId]

  if (!item) {
    throw new ApplicationError("Storefront legal page was not found.", { pageId }, 404)
  }

  return storefrontLegalPageResponseSchema.parse({
    settings,
    item,
  })
}

export async function getStorefrontCatalog(database: Kysely<unknown>, query: unknown) {
  const settings = await getStorefrontSettings(database)
  const filters = storefrontCatalogQuerySchema.parse(query ?? {})
  const products = await readProjectedStorefrontProducts(database)
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
  const products = await readProjectedStorefrontProducts(database)
  const product = await getProjectedStorefrontProduct(database, query)

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
    specificationGroups: buildStorefrontProductSpecifications(product, card),
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
