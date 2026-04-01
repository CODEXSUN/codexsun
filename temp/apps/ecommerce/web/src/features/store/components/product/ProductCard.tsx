import { ShoppingCartIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStorefront } from "@/features/store/context/storefront-context"
import { formatCurrency, getPrimaryProductImage } from "@/features/store/lib/storefront-utils"
import type { StorefrontProduct } from "@/features/store/types/storefront"
import { RatingStars } from "./RatingStars"
import { ShareButton } from "./ShareButton"
import { WishlistButton } from "./WishlistButton"

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const { addToCart } = useStorefront()
  const imageUrl = getPrimaryProductImage(product)
  const isOutOfStock = product.inventory <= 0

  return (
    <Card className="group overflow-hidden rounded-[2rem] border border-[#ece2d4] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,246,239,0.92)_100%)] shadow-[0_26px_55px_-42px_rgba(48,31,19,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-42px_rgba(48,31,19,0.34)]">
      <Link to={`/product/${product.slug}`} className="relative block aspect-[4/4.65] overflow-hidden bg-[linear-gradient(135deg,#efe4d5,#f8f3ec)]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-foreground/60">
            {product.name}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <Badge variant="outline" className="border-white/70 bg-white/85 text-foreground shadow-sm backdrop-blur">
            {product.catalogBadge ?? product.categoryName}
          </Badge>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <div className="rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              Sale
            </div>
          ) : null}
        </div>
      </Link>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {product.brand || "Catalog"}
            </span>
            <span className="text-xs text-muted-foreground">
              {product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}
            </span>
          </div>
          <Link to={`/product/${product.slug}`} className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition group-hover:text-foreground/85">
            {product.name}
          </Link>
          {product.shortDescription ? (
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {product.shortDescription}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[1.3rem] bg-white/70 px-4 py-3 ring-1 ring-[#efe5d9]">
          <div className="min-w-0">
            <div className="text-[1.05rem] font-semibold text-foreground">{formatCurrency(product.price)}</div>
            {product.compareAtPrice ? (
              <div className="text-xs text-muted-foreground line-through">{formatCurrency(product.compareAtPrice)}</div>
            ) : (
              <div className="text-xs text-muted-foreground">Regular price</div>
            )}
          </div>
          <div className="shrink-0">
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
          </div>
        </div>
      </CardContent>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-5 pt-0">
        <Button className="h-11 rounded-full bg-foreground text-background hover:bg-foreground/90" disabled={isOutOfStock} onClick={() => addToCart(product.id, 1)}>
          <ShoppingCartIcon className="size-4" />
          {isOutOfStock ? "Out of stock" : "Add to Cart"}
        </Button>
        <div className="flex items-center gap-2 rounded-full bg-white/75 px-2 py-1 ring-1 ring-[#ece1d3]">
          <WishlistButton productId={product.id} />
          <ShareButton productName={product.name} />
        </div>
      </div>
    </Card>
  )
}
