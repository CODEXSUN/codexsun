export type WishlistItem = {
  readonly id: string
  readonly image: string
  readonly inStock: boolean
  readonly lowStockWarning?: string | undefined
  readonly originalPrice?: string | undefined
  readonly price: string
  readonly rating?: number | undefined
  readonly title: string
}

export type WishlistGridProps = {
  readonly className?: string | undefined
  readonly items: readonly WishlistItem[]
  readonly onAddToCart?: ((itemId: string) => void) | undefined
  readonly onClearWishlist?: (() => void) | undefined
  readonly onMoveAllToCart?: (() => void) | undefined
  readonly onRemoveItem?: ((itemId: string) => void) | undefined
}
