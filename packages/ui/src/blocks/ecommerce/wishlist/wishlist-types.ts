export type WishlistItem = {
  readonly id: string
  readonly image: string
  readonly inStock: boolean
  readonly lowStockWarning?: string
  readonly originalPrice?: string
  readonly price: string
  readonly rating?: number
  readonly title: string
}

export type WishlistGridProps = {
  readonly className?: string
  readonly items: readonly WishlistItem[]
  readonly onAddToCart?: (itemId: string) => void
  readonly onClearWishlist?: () => void
  readonly onMoveAllToCart?: () => void
  readonly onRemoveItem?: (itemId: string) => void
}
