export interface ProductColorSwatch {
  hex: string
  id: string
  name: string
}

export interface ProductItem {
  badge?: string
  brand?: string
  category?: string
  colors?: readonly ProductColorSwatch[]
  currency?: string
  description?: string
  discountPercent?: number
  id: string
  imageUrl: string
  inStock?: boolean
  isNew?: boolean
  originalPrice?: number
  price: number
  rating?: number
  reviewCount?: number
  secondaryImageUrl?: string
  title: string
}

export interface ProductCardProps {
  className?: string
  onAddToCart?: (product: ProductItem, selectedColor?: ProductColorSwatch) => void
  onQuickView?: (product: ProductItem) => void
  onToggleWishlist?: (product: ProductItem, isWishlisted: boolean) => void
  product: ProductItem
  showQuickView?: boolean
  showWishlist?: boolean
}
