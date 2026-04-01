import type {
  CatalogFilters,
  StorefrontCartItem,
  StorefrontCategory,
  StorefrontProduct,
  StorefrontSortOption,
} from "@/features/store/types/storefront"

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getPrimaryProductImage(product: StorefrontProduct) {
  return product.images[0] ?? ''
}

export function buildDefaultFilters(categorySlug?: string | null): CatalogFilters {
  return {
    department: "all",
    categories: categorySlug ? [categorySlug] : [],
    sizes: [],
    colors: [],
    fabrics: [],
    fits: [],
    sleeves: [],
    occasions: [],
    minPrice: 0,
    maxPrice: 10000,
    rating: 0,
    availabilityOnly: false,
  }
}

export function getFilterOptions(products: StorefrontProduct[]) {
  const unique = (values: Array<string | null | undefined>) =>
    [...new Set(values.filter((value): value is string => Boolean(value)))]
      .sort((left, right) => left.localeCompare(right))

  return {
    categories: unique(products.map((product) => product.categorySlug)),
    sizes: unique(products.flatMap((product) => product.sizes)),
    colors: unique(products.flatMap((product) => product.colors.map((color) => color.name))),
    fabrics: unique(products.map((product) => product.fabric)),
    fits: unique(products.map((product) => product.fit)),
    sleeves: unique(products.map((product) => product.sleeve)),
    occasions: unique(products.map((product) => product.occasion)),
  }
}

export function filterProducts(products: StorefrontProduct[], filters: CatalogFilters, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  return products.filter((product) => {
    if (filters.department !== "all" && product.department !== filters.department) return false
    if (filters.categories.length > 0 && !filters.categories.includes(product.categorySlug)) return false
    if (filters.sizes.length > 0 && !product.sizes.some((size) => filters.sizes.includes(size))) return false
    if (filters.colors.length > 0 && !product.colors.some((color) => filters.colors.includes(color.name))) return false
    if (filters.fabrics.length > 0 && (!product.fabric || !filters.fabrics.includes(product.fabric))) return false
    if (filters.fits.length > 0 && (!product.fit || !filters.fits.includes(product.fit))) return false
    if (filters.sleeves.length > 0 && (!product.sleeve || !filters.sleeves.includes(product.sleeve))) return false
    if (filters.occasions.length > 0 && (!product.occasion || !filters.occasions.includes(product.occasion))) return false
    if (product.price < filters.minPrice || product.price > filters.maxPrice) return false
    if (product.rating < filters.rating) return false
    if (filters.availabilityOnly && product.inventory <= 0) return false

    if (!normalizedQuery) return true

    return [
      product.name,
      product.brand,
      product.categoryName,
      product.shortDescription ?? '',
      product.description ?? '',
      product.fabric,
      product.occasion,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  })
}

export function sortProducts(products: StorefrontProduct[], sort: StorefrontSortOption) {
  const sorted = [...products]

  switch (sort) {
    case "featured":
      return sorted.sort(
        (left, right) => Number(right.featured) - Number(left.featured) || right.rating - left.rating,
      )
    case "latest":
      return sorted.sort(
        (left, right) => Number(right.newArrival) - Number(left.newArrival) || right.rating - left.rating,
      )
    case "price-asc":
      return sorted.sort((left, right) => left.price - right.price)
    case "price-desc":
      return sorted.sort((left, right) => right.price - left.price)
    case "rating-desc":
      return sorted.sort((left, right) => right.rating - left.rating)
    case "name-asc":
      return sorted.sort((left, right) => left.name.localeCompare(right.name))
  }
}

export function getCategoryBySlug(categories: StorefrontCategory[], slug?: string | null) {
  return categories.find((category) => category.slug === slug) ?? null
}

export function getCartSubtotal(products: StorefrontProduct[], cartItems: StorefrontCartItem[]) {
  return cartItems.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.productId)
    return total + (product ? product.price * item.quantity : 0)
  }, 0)
}
