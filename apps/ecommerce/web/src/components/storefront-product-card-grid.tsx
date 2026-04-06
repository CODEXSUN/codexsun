import type { StorefrontProductCard as StorefrontProductCardType } from "@ecommerce/shared"
import { cn } from "@/lib/utils"

import { storefrontPaths } from "../lib/storefront-routes"
import { StorefrontProductCard } from "./storefront-product-card"

export type StorefrontProductLaneCardsPerRow = 1 | 2 | 3 | 4
export type StorefrontProductLaneRowsToShow = 1 | 2 | 3

function resolveGridClassName(cardsPerRow: StorefrontProductLaneCardsPerRow) {
  if (cardsPerRow === 4) {
    return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
  }

  if (cardsPerRow === 3) {
    return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
  }

  if (cardsPerRow === 2) {
    return "grid-cols-1 md:grid-cols-2"
  }

  return "grid-cols-1"
}

export function StorefrontProductCardGrid({
  items,
  cardsPerRow,
  rowsToShow = 1,
  className,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}: {
  items: StorefrontProductCardType[]
  cardsPerRow: StorefrontProductLaneCardsPerRow
  rowsToShow?: StorefrontProductLaneRowsToShow
  className?: string
  isWishlisted?: (productId: string) => boolean
  onToggleWishlist?: (item: StorefrontProductCardType) => void
  onAddToCart?: (item: StorefrontProductCardType) => void
}) {
  const visibleItems = items.slice(0, cardsPerRow * rowsToShow)
  const density = cardsPerRow === 4 ? "compact" : "default"

  return (
    <div className={cn("grid auto-rows-fr gap-3.5", resolveGridClassName(cardsPerRow), className)}>
      {visibleItems.map((item) => (
        <StorefrontProductCard
          key={item.id}
          item={item}
          href={storefrontPaths.product(item.slug)}
          density={density}
          className="h-full"
          isWishlisted={isWishlisted?.(item.id) ?? false}
          onToggleWishlist={onToggleWishlist ? () => onToggleWishlist(item) : undefined}
          onAddToCart={() => onAddToCart?.(item)}
        />
      ))}
    </div>
  )
}
