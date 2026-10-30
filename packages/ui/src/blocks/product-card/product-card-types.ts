export interface ProductColorSwatch {
  hex: string
  id: string
  name: string
}

export interface ProductItem {
  badge?: string | undefined
  brand?: string | undefined
  category?: string | undefined
  colors?: readonly ProductColorSwatch[] | undefined
  currency?: string | undefined
  description?: string | undefined
  discountPercent?: number | undefined
  id: string
  imageUrl: string
  inStock?: boolean | undefined
  isNew?: boolean | undefined
  originalPrice?: number | undefined
  price: number
  rating?: number | undefined
  reviewCount?: number | undefined
  secondaryImageUrl?: string | undefined
  title: string
}

export interface ProductCardProps {
  className?: string | undefined
  onAddToCart?: ((product: ProductItem, selectedColor?: ProductColorSwatch) => void) | undefined
  onQuickView?: ((product: ProductItem) => void) | undefined
  onToggleWishlist?: ((product: ProductItem, isWishlisted: boolean) => void) | undefined
  product: ProductItem
  showQuickView?: boolean | undefined
  showWishlist?: boolean | undefined
}
