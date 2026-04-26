import type { Kysely } from "kysely"

import {
  listJsonStorePayloads,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { listCommonModuleItems } from "../../../core/src/services/common-module-service.js"
import { type Product } from "../../../core/shared/index.js"
import { getAvailableQuantityByProductIds } from "../../../stock/src/services/live-stock-service.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  storefrontCatalogQuerySchema,
  storefrontCatalogResponseSchema,
  storefrontLegalPageResponseSchema,
  storefrontLandingResponseSchema,
  storefrontMerchandisingAutomationReportSchema,
  storefrontProductResponseSchema,
  storefrontBrandDiscoveryCardSchema,
  storefrontRecommendationReportSchema,
  type StorefrontCategorySummary,
  type StorefrontBrandDiscoveryCard,
  type StorefrontLegalPage,
  type StorefrontMerchandisingAutomationReport,
  type StorefrontProductCard,
  type StorefrontProductDetail,
  type StorefrontProductResponse,
  type StorefrontRecommendationItem,
  type StorefrontRecommendationReason,
  type StorefrontRecommendationReport,
} from "../../shared/index.js"
import { getStorefrontSettings } from "./storefront-settings-service.js"
import {
  getProjectedStorefrontProduct,
  readProjectedStorefrontProducts,
} from "./projected-product-service.js"
import { readStorefrontOrders } from "./storefront-order-storage.js"

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

export function toStorefrontProductCard(
  product: Product,
  availableQuantity: number
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
    availableQuantity,
    tagNames: product.tagNames,
  }
}

async function buildAvailableQuantityMap(database: Kysely<unknown>, products: Product[]) {
  return getAvailableQuantityByProductIds(
    database,
    products.map((item) => item.id)
  )
}

function tokenizeSearchInput(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function scoreSearchResult(item: StorefrontProductCard, search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  const tokens = tokenizeSearchInput(normalizedSearch)
  const name = item.name.toLowerCase()
  const brand = item.brandName?.toLowerCase() ?? ""
  const category = item.categoryName?.toLowerCase() ?? ""
  const department = item.department?.toLowerCase() ?? ""
  const description = item.shortDescription?.toLowerCase() ?? ""
  const tags = item.tagNames.map((entry) => entry.toLowerCase())

  let score = 0

  if (name === normalizedSearch) {
    score += 80
  } else if (name.startsWith(normalizedSearch)) {
    score += 48
  } else if (name.includes(normalizedSearch)) {
    score += 32
  }

  if (brand === normalizedSearch) {
    score += 24
  }

  if (category === normalizedSearch || department === normalizedSearch) {
    score += 20
  }

  for (const token of tokens) {
    if (name.includes(token)) {
      score += 12
    }
    if (brand.includes(token)) {
      score += 8
    }
    if (category.includes(token) || department.includes(token)) {
      score += 6
    }
    if (description.includes(token)) {
      score += 4
    }
    if (tags.some((entry) => entry.includes(token))) {
      score += 6
    }
  }

  score += item.availableQuantity > 0 ? 4 : 0
  score += item.isBestSeller ? 5 : 0
  score += item.isFeaturedLabel ? 4 : 0
  score += item.isNewArrival ? 3 : 0

  return score
}

function hasLiveStock(item: Pick<StorefrontProductCard, "availableQuantity">) {
  return item.availableQuantity > 0
}

function compareLiveStockFirst(
  left: Pick<StorefrontProductCard, "availableQuantity">,
  right: Pick<StorefrontProductCard, "availableQuantity">
) {
  return Number(hasLiveStock(right)) - Number(hasLiveStock(left))
}

function sortStorefrontProductCards(
  items: StorefrontProductCard[],
  compareWithinStockGroup: (left: StorefrontProductCard, right: StorefrontProductCard) => number
) {
  return items.sort(
    (left, right) =>
      compareLiveStockFirst(left, right) ||
      compareWithinStockGroup(left, right) ||
      left.name.localeCompare(right.name)
  )
}

function buildRecommendationCandidates(
  products: Product[],
  input: {
    baseProduct?: Product | null
    search?: string | null
    limit: number
    availableQuantityByProductId: Map<string, number>
  }
): StorefrontRecommendationItem[] {
  const base = input.baseProduct ?? null
  const search = input.search?.trim() ?? ""
  const baseTags = new Set(base?.tagNames.map((item) => item.toLowerCase()) ?? [])

  const candidates = products
    .filter((item) => item.isActive)
    .filter((item) => (base ? item.id !== base.id : true))
    .map((product) => {
      const card = toStorefrontProductCard(
        product,
        input.availableQuantityByProductId.get(product.id) ?? 0
      )
      let reason: StorefrontRecommendationReason = "best_seller"
      let score = 0

      if (search) {
        score = scoreSearchResult(card, search)
        reason = "search_match"
      } else if (base && product.categoryName === base.categoryName) {
        score += 30
        reason = "category_affinity"
      } else if (base && product.brandName === base.brandName) {
        score += 26
        reason = "brand_affinity"
      }

      if (
        base &&
        product.tagNames.some((item) => baseTags.has(item.toLowerCase()))
      ) {
        score += 18
        reason = "tag_affinity"
      }

      if (product.isBestSeller) {
        score += 12
        reason = reason === "search_match" ? reason : "best_seller"
      }

      if (product.isNewArrival) {
        score += 8
        if (reason !== "search_match") {
          reason = "new_arrival"
        }
      }

      if (card.availableQuantity > 0) {
        score += 6
      }

      return {
        ...card,
        reason,
        score,
      }
    })
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        compareLiveStockFirst(left, right) ||
        right.score - left.score ||
        right.availableQuantity - left.availableQuantity ||
        left.name.localeCompare(right.name)
    )

  return candidates.slice(0, input.limit)
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
    "Commercial values and shipping notes.",
    [
      { label: "Selling price", value: `INR ${detailCard.sellingPrice.toFixed(2)}` },
      { label: "MRP", value: `INR ${detailCard.mrp.toFixed(2)}` },
      {
        label: "Discount",
        value: detailCard.discountPercent > 0 ? `${detailCard.discountPercent}%` : null,
      },
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
        value: variant.attributes
          .map((attribute) => `${attribute.attributeName}: ${attribute.attributeValue}`)
          .join(", "),
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

function resolveStorefrontProductHref(product: Product) {
  return `/shop/product/${encodeURIComponent(product.slug)}`
}

function resolveStorefrontProductImage(product: Product) {
  return (
    product.primaryImageUrl ??
    product.images.find((image) => image.isActive)?.imageUrl ??
    product.variants
      .flatMap((variant) => variant.images)
      .find((image) => image.isActive)?.imageUrl ??
    null
  )
}

function resolveStorefrontProductPlacementOrder(
  product: Product,
  key: "discoveryBoardOrder" | "visualStripOrder"
) {
  return product.storefront?.[key] ?? product[key] ?? 0
}

function isValidDiscoveryBoardSlot(order: number) {
  return Number.isInteger(order) && order >= 1 && order <= 8
}

function isStorefrontProductPlacementEnabled(
  product: Product,
  key: "discoveryBoardEnabled" | "visualStripEnabled"
) {
  return Boolean(product.storefront?.[key] || product[key])
}

export async function getStorefrontLanding(database: Kysely<unknown>) {
  const settings = await getStorefrontSettings(database)
  const products = await readProjectedStorefrontProducts(database)
  const availableQuantityByProductId = await buildAvailableQuantityMap(database, products)
  const items = products
    .filter((item) => item.isActive)
    .map((item) => toStorefrontProductCard(item, availableQuantityByProductId.get(item.id) ?? 0))
    .sort(
      (left, right) =>
        compareLiveStockFirst(left, right) ||
        Number(right.isFeaturedLabel) - Number(left.isFeaturedLabel) ||
        Number(right.isBestSeller) - Number(left.isBestSeller) ||
        Number(right.isNewArrival) - Number(left.isNewArrival) ||
        left.name.localeCompare(right.name)
    )
  const featuredItemCount = Math.max(
    1,
    (settings.sections.featured.cardsPerRow ?? 4) *
      (settings.sections.featured.rowsToShow ?? 2)
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
        Number((availableQuantityByProductId.get(right.id) ?? 0) > 0) -
          Number((availableQuantityByProductId.get(left.id) ?? 0) > 0) ||
        (left.storefront?.homeSliderOrder ?? 0) -
          (right.storefront?.homeSliderOrder ?? 0) ||
        left.name.localeCompare(right.name)
    )
    .map((item) => toStorefrontProductCard(item, availableQuantityByProductId.get(item.id) ?? 0))
  const featured = items.filter((item) => item.isFeaturedLabel).slice(0, featuredItemCount)
  const newArrivals = items.filter((item) => item.isNewArrival).slice(0, newArrivalItemCount)
  const bestSellers = items.filter((item) => item.isBestSeller).slice(0, bestSellerItemCount)
  const categories = await listStorefrontCategories(database, items)
  const brands = listStorefrontBrands(products)
  const discoveryBoardProducts = products
    .filter((product) =>
      product.isActive &&
      isStorefrontProductPlacementEnabled(product, "discoveryBoardEnabled") &&
      Boolean(resolveStorefrontProductImage(product)) &&
      isValidDiscoveryBoardSlot(
        resolveStorefrontProductPlacementOrder(product, "discoveryBoardOrder")
      )
    )
    .sort(
      (left, right) =>
        resolveStorefrontProductPlacementOrder(left, "discoveryBoardOrder") -
          resolveStorefrontProductPlacementOrder(right, "discoveryBoardOrder") ||
        left.name.localeCompare(right.name)
    )
  const visualStripProducts = products
    .filter((product) =>
      product.isActive &&
      isStorefrontProductPlacementEnabled(product, "visualStripEnabled") &&
      Boolean(resolveStorefrontProductImage(product))
    )
    .sort(
      (left, right) =>
        resolveStorefrontProductPlacementOrder(left, "visualStripOrder") -
          resolveStorefrontProductPlacementOrder(right, "visualStripOrder") ||
        left.name.localeCompare(right.name)
    )
  const discoveryBoardSlots = Array.from({ length: 8 }, () => null as null | {
    title: string
    href: string
    imageUrl: string
  })

  for (const product of discoveryBoardProducts) {
    const slotIndex = resolveStorefrontProductPlacementOrder(product, "discoveryBoardOrder") - 1

    if (slotIndex < 0 || slotIndex >= discoveryBoardSlots.length || discoveryBoardSlots[slotIndex]) {
      continue
    }

    const imageUrl = resolveStorefrontProductImage(product)
    if (!imageUrl) {
      continue
    }

    discoveryBoardSlots[slotIndex] = {
      title: product.name,
      href: resolveStorefrontProductHref(product),
      imageUrl,
    }
  }

  const highestUsedDiscoverySlotIndex = discoveryBoardSlots.reduce(
    (highestIndex, slot, index) => (slot ? index : highestIndex),
    -1
  )
  const discoveryBoardCardCount =
    highestUsedDiscoverySlotIndex >= 4 ? 2 : highestUsedDiscoverySlotIndex >= 0 ? 1 : 0
  const liveDiscoveryCards = Array.from({ length: discoveryBoardCardCount }, (_, cardIndex) => {
    const slotOffset = cardIndex * 4
    const cardSlots = discoveryBoardSlots.slice(slotOffset, slotOffset + 4)

    return {
      id: `discovery-board:card:${cardIndex + 1}`,
      title: `Discovery board ${cardIndex + 1}`,
      href: null,
      images: cardSlots.map((slot) => slot?.imageUrl ?? null),
      imageLinks: cardSlots.map((slot) => slot?.href ?? null),
      imageTitles: cardSlots.map((slot) => slot?.title ?? null),
    }
  })
  const derivedDiscoveryBoard = {
    ...settings.discoveryBoard,
    enabled: liveDiscoveryCards.length > 0,
    cards: liveDiscoveryCards.length > 0 ? liveDiscoveryCards : settings.discoveryBoard.cards,
  }
  const liveVisualStripCards = visualStripProducts.map((product) => ({
    id: `visual-strip:product:${product.id}`,
    label: product.name,
    href: resolveStorefrontProductHref(product),
    imageUrl: resolveStorefrontProductImage(product) ?? "",
  }))
  const derivedVisualStrip = {
    ...settings.visualStrip,
    enabled: liveVisualStripCards.length > 0,
    cards: liveVisualStripCards.length > 0 ? liveVisualStripCards : settings.visualStrip.cards,
  }

  return storefrontLandingResponseSchema.parse({
    settings: {
      ...settings,
      discoveryBoard: derivedDiscoveryBoard,
      visualStrip: derivedVisualStrip,
    },
    merchandisingDebug: {
      discoveryBoardProductCount: discoveryBoardProducts.length,
      visualStripProductCount: visualStripProducts.length,
    },
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
  const availableQuantityByProductId = await buildAvailableQuantityMap(database, products)
  const categories = await listStorefrontCategories(
    database,
    products
      .filter((item) => item.isActive)
      .map((item) => toStorefrontProductCard(item, availableQuantityByProductId.get(item.id) ?? 0))
  )
  let items = products
    .filter((item) => item.isActive)
    .map((item) => toStorefrontProductCard(item, availableQuantityByProductId.get(item.id) ?? 0))

  if (filters.search) {
    const search = filters.search.toLowerCase()
    items = items.filter((item) =>
      [item.name, item.brandName, item.categoryName, item.department, item.shortDescription]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    )
    sortStorefrontProductCards(
      items,
      (left, right) => scoreSearchResult(right, search) - scoreSearchResult(left, search)
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
      sortStorefrontProductCards(
        items,
        (left, right) =>
          Number(right.isNewArrival) - Number(left.isNewArrival)
      )
      break
    case "price-asc":
      sortStorefrontProductCards(items, (left, right) => left.sellingPrice - right.sellingPrice)
      break
    case "price-desc":
      sortStorefrontProductCards(items, (left, right) => right.sellingPrice - left.sellingPrice)
      break
    default:
      sortStorefrontProductCards(
        items,
        (left, right) =>
          Number(right.isFeaturedLabel) - Number(left.isFeaturedLabel) ||
          Number(right.isBestSeller) - Number(left.isBestSeller)
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
    recommendationRail: buildRecommendationCandidates(products, {
      search: filters.search ?? null,
      limit: 6,
      availableQuantityByProductId,
    }),
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
  const availableQuantityByProductId = await buildAvailableQuantityMap(database, products)

  const relatedItems = products
    .filter(
      (item) =>
        item.id !== product.id &&
        item.isActive &&
        (item.categoryName === product.categoryName ||
          item.brandName === product.brandName ||
          item.storefrontDepartment === product.storefrontDepartment)
    )
    .map((item) => toStorefrontProductCard(item, availableQuantityByProductId.get(item.id) ?? 0))
    .sort(
      (left, right) =>
        compareLiveStockFirst(left, right) ||
        Number(right.isBestSeller) - Number(left.isBestSeller) ||
        Number(right.isNewArrival) - Number(left.isNewArrival) ||
        left.name.localeCompare(right.name)
    )
    .slice(0, 4)
  const recommendedItems = buildRecommendationCandidates(products, {
    baseProduct: product,
    limit: 4,
    availableQuantityByProductId,
  })

  const card = toStorefrontProductCard(product, availableQuantityByProductId.get(product.id) ?? 0)
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
    recommendedItems,
  })
}

export async function getStorefrontRecommendationReport(
  database: Kysely<unknown>
): Promise<StorefrontRecommendationReport> {
  const products = await readProjectedStorefrontProducts(database)
  const activeProducts = products.filter((item) => item.isActive)
  const availableQuantityByProductId = await buildAvailableQuantityMap(database, activeProducts)

  return storefrontRecommendationReportSchema.parse({
    generatedAt: new Date().toISOString(),
    searchPreview: buildRecommendationCandidates(activeProducts, {
      search: activeProducts[0]?.brandName ?? activeProducts[0]?.name ?? "catalog",
      limit: 5,
      availableQuantityByProductId,
    }),
    productPreview: buildRecommendationCandidates(activeProducts, {
      baseProduct: activeProducts[0] ?? null,
      limit: 5,
      availableQuantityByProductId,
    }),
    trendingPreview: buildRecommendationCandidates(activeProducts, {
      limit: 5,
      availableQuantityByProductId,
    }),
  })
}

export async function getStorefrontMerchandisingAutomationReport(
  database: Kysely<unknown>
): Promise<StorefrontMerchandisingAutomationReport> {
  const [products, orders, settings] = await Promise.all([
    readProjectedStorefrontProducts(database),
    readStorefrontOrders(database),
    getStorefrontSettings(database),
  ])
  const activeProducts = products.filter((item) => item.isActive)
  const availableQuantityByProductId = await buildAvailableQuantityMap(database, activeProducts)
  const productCards = activeProducts.map((item) =>
    toStorefrontProductCard(item, availableQuantityByProductId.get(item.id) ?? 0)
  )
  const featuredCandidates = buildRecommendationCandidates(activeProducts, {
    limit: 6,
    availableQuantityByProductId,
  })
  const lowStockFeaturedItems = productCards.filter(
    (item) => item.isFeaturedLabel && item.availableQuantity > 0 && item.availableQuantity <= 5
  )
  const staleMerchandisingItems = productCards.filter((item) => {
    const paidCount = orders.filter(
      (order) =>
        order.paymentStatus === "paid" &&
        order.items.some((orderItem) => orderItem.productId === item.id)
    ).length

    return item.isFeaturedLabel && paidCount === 0
  })

  return storefrontMerchandisingAutomationReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      totalActiveProducts: activeProducts.length,
      featuredCandidateCount: featuredCandidates.length,
      lowStockFeaturedCount: lowStockFeaturedItems.length,
      automationReadyCount: featuredCandidates.filter((item) => item.availableQuantity > 5).length,
      experimentSurfaceCount: 9,
    },
    featuredCandidates,
    lowStockFeaturedItems,
    staleMerchandisingItems,
    experimentSurfaces: [
      {
        surfaceKey: "hero",
        hypothesis: "Editorial hero copy converts better when anchored to best-selling live stock.",
        primaryMetric: "hero_to_catalog_ctr",
        secondaryMetric: "homepage_conversion_rate",
        status: settings.visibility.hero ? "ready" : "blocked",
      },
      {
        surfaceKey: "featured",
        hypothesis: "Featured rails should prefer in-stock best sellers with higher search affinity.",
        primaryMetric: "featured_clickthrough_rate",
        secondaryMetric: "featured_add_to_cart_rate",
        status: settings.visibility.featured ? "ready" : "blocked",
      },
      {
        surfaceKey: "new_arrivals",
        hypothesis: "Fresh drops convert better when separated from repeat hero inventory.",
        primaryMetric: "new_arrival_ctr",
        secondaryMetric: "new_arrival_revenue_share",
        status: settings.visibility.newArrivals ? "ready" : "blocked",
      },
      {
        surfaceKey: "best_sellers",
        hypothesis: "Best-seller rails should automatically demote low-stock items before outages.",
        primaryMetric: "best_seller_ctr",
        secondaryMetric: "best_seller_stockout_rate",
        status: settings.visibility.bestSellers ? "ready" : "blocked",
      },
      {
        surfaceKey: "coupon_banner",
        hypothesis: "Coupon-banner placement should follow segment-aware promotion windows.",
        primaryMetric: "coupon_banner_apply_rate",
        secondaryMetric: "coupon_assisted_conversion_rate",
        status: "watch",
      },
      {
        surfaceKey: "gift_corner",
        hypothesis: "Gift-corner storytelling should be tested against direct catalog CTAs.",
        primaryMetric: "gift_corner_ctr",
        secondaryMetric: "gift_corner_revenue",
        status: "watch",
      },
      {
        surfaceKey: "trending",
        hypothesis: "Trending cards should rotate based on recommendation and search demand overlap.",
        primaryMetric: "trending_card_ctr",
        secondaryMetric: "trend_to_pdp_rate",
        status: settings.trendingSection.enabled ? "ready" : "blocked",
      },
      {
        surfaceKey: "brand_showcase",
        hypothesis: "Brand storytelling should prioritize brands with active recommendation lift.",
        primaryMetric: "brand_showcase_ctr",
        secondaryMetric: "brand_catalog_conversion",
        status: settings.brandShowcase.enabled ? "ready" : "blocked",
      },
      {
        surfaceKey: "campaign",
        hypothesis: "Campaign layouts should pair lifecycle win-back messaging with strong stock posture.",
        primaryMetric: "campaign_cta_ctr",
        secondaryMetric: "campaign_conversion_rate",
        status: settings.visibility.cta ? "ready" : "blocked",
      },
    ],
  })
}

export async function listStorefrontOrdersRaw(database: Kysely<unknown>) {
  return listJsonStorePayloads<unknown>(database, ecommerceTableNames.orders)
}
