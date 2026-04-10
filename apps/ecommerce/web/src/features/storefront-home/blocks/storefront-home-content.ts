import type { StorefrontCategorySummary, StorefrontProductCard } from "@ecommerce/shared"

export function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

export function getStorefrontCategoryItems(categories: StorefrontCategorySummary[]) {
  return categories.filter((category) => category.productCount > 0 && category.slug !== "all-items")
}

export function mapStorefrontCartItem(item: StorefrontProductCard) {
  return {
    productId: item.id,
    slug: item.slug,
    name: item.name,
    imageUrl: item.primaryImageUrl,
    unitPrice: item.sellingPrice,
    mrp: item.mrp,
    shippingCharge: item.shippingCharge,
    handlingCharge: item.handlingCharge,
  }
}
