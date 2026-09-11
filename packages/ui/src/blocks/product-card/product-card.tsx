import { Eye, Heart, ShoppingBag, Star } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { cn } from '../../lib/utils'
import type { ProductCardProps, ProductColorSwatch } from './product-card-types'

export function ProductCard({
  className,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  product,
  showQuickView = true,
  showWishlist = true,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedColor, setSelectedColor] = useState<ProductColorSwatch | undefined>(
    product.colors?.[0],
  )

  const currency = product.currency ?? '$'
  const inStock = product.inStock ?? true

  function handleWishlistToggle(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !isWishlisted
    setIsWishlisted(next)
    onToggleWishlist?.(product, next)
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()
    if (!inStock) return
    onAddToCart?.(product, selectedColor)
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-foreground/25 hover:shadow-md select-none',
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
        <img
          alt={product.title}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          src={
            isHovered && product.secondaryImageUrl
              ? product.secondaryImageUrl
              : product.imageUrl
          }
        />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
          {product.discountPercent ? (
            <Badge className="bg-destructive text-destructive-foreground font-bold shadow-xs">
              -{product.discountPercent}%
            </Badge>
          ) : product.isNew ? (
            <Badge className="bg-primary text-primary-foreground font-bold shadow-xs">
              NEW
            </Badge>
          ) : product.badge ? (
            <Badge variant="secondary">{product.badge}</Badge>
          ) : null}

          {!inStock && (
            <Badge className="bg-muted text-muted-foreground font-medium" variant="outline">
              Out of stock
            </Badge>
          )}
        </div>

        {/* Floating Actions */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          {showWishlist && (
            <button
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={cn(
                'flex size-8 items-center justify-center rounded-full bg-background/85 backdrop-blur-xs text-foreground shadow-xs transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isWishlisted && 'text-destructive',
              )}
              type="button"
              onClick={handleWishlistToggle}
            >
              <Heart
                className={cn('size-4', isWishlisted && 'fill-destructive text-destructive')}
              />
            </button>
          )}

          {showQuickView && onQuickView && (
            <button
              aria-label="Quick view product"
              className="flex size-8 items-center justify-center rounded-full bg-background/85 backdrop-blur-xs text-muted-foreground shadow-xs transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="button"
              onClick={() => onQuickView(product)}
            >
              <Eye className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {product.brand}
          </span>
        )}

        <h4 className="mt-0.5 line-clamp-1 text-sm font-semibold tracking-tight text-foreground">
          {product.title}
        </h4>

        {/* Rating */}
        {product.rating !== undefined && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <div className="flex items-center text-amber-500">
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
            </div>
            <span className="font-semibold text-foreground text-[11px]">{product.rating}</span>
            {product.reviewCount !== undefined && (
              <span className="text-[11px] text-muted-foreground">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Color Swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            {product.colors.map((color) => (
              <button
                aria-label={`Select color ${color.name}`}
                className={cn(
                  'size-4.5 rounded-full border border-border/80 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selectedColor?.id === color.id && 'ring-2 ring-primary ring-offset-1',
                )}
                key={color.id}
                style={{ backgroundColor: color.hex }}
                title={color.name}
                type="button"
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-border/40">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-foreground">
              {currency}
              {product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {currency}
                {product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <Button
            className="rounded-xl px-2.5 py-1 text-xs font-semibold"
            disabled={!inStock}
            size="sm"
            variant="secondary"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="size-3.5" />
            <span className="hidden xs:inline">Add</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
