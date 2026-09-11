import { HeartIcon, ShoppingBagIcon, StarIcon, Trash2Icon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/button'
import { Badge } from '../../../components/badge'
import type { WishlistGridProps } from './wishlist-types'

export function WishlistGrid({
  className,
  items,
  onAddToCart,
  onClearWishlist,
  onMoveAllToCart,
  onRemoveItem,
}: WishlistGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/80 bg-card">
        <HeartIcon className="size-12 stroke-[1.2] text-muted-foreground/40 mb-3" />
        <h4 className="text-sm font-bold text-foreground">Your wishlist is empty</h4>
        <p className="text-xs text-muted-foreground mt-1">Explore our catalog and click the heart icon on any product to save it for later.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Saved Items</h3>
          <p className="text-xs text-muted-foreground">You have {items.length} items saved in your personal wishlist.</p>
        </div>

        <div className="flex items-center gap-2">
          {onMoveAllToCart && (
            <Button size="sm" className="gap-1.5 text-xs" onClick={onMoveAllToCart}>
              <ShoppingBagIcon className="size-3.5" />
              <span>Move All to Cart</span>
            </Button>
          )}

          {onClearWishlist && (
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-destructive" onClick={onClearWishlist}>
              Clear Wishlist
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:border-border hover:shadow-sm"
          >
            {/* Image + Status badges */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted mb-3 border border-border/40">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Stock status badge */}
              <div className="absolute top-2 left-2">
                {item.inStock ? (
                  item.lowStockWarning ? (
                    <Badge variant="destructive" className="text-[10px] font-bold">
                      {item.lowStockWarning}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] font-bold bg-background/90 backdrop-blur-sm text-foreground">
                      In Stock
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold bg-muted/90 text-muted-foreground">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Remove button */}
              {onRemoveItem && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
                  aria-label={`Remove ${item.title}`}
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground line-clamp-1">{item.title}</h4>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-sm font-bold text-primary">{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-[11px] text-muted-foreground line-through">
                      {item.originalPrice}
                    </span>
                  )}
                </div>

                {item.rating && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                    <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Move to Cart button */}
              <Button
                size="sm"
                className="w-full gap-1.5 mt-3 text-xs"
                disabled={!item.inStock}
                onClick={() => onAddToCart?.(item.id)}
              >
                <ShoppingBagIcon className="size-3.5" />
                <span>{item.inStock ? 'Move to Cart' : 'Out of Stock'}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
