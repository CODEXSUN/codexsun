import { Heart, Share2, ShoppingCart } from "lucide-react"
import { Link } from "react-router-dom"

import type { StorefrontProductCard as StorefrontProductCardType } from "@ecommerce/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function StorefrontProductCard({
  item,
  href,
  onAddToCart,
}: {
  item: StorefrontProductCardType
  href: string
  onAddToCart: () => void
}) {
  const isOutOfStock = item.availableQuantity <= 0

  return (
    <Card className="group overflow-hidden rounded-[2rem] border border-[#eadccd] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,245,238,0.92)_100%)] py-0 shadow-[0_26px_55px_-42px_rgba(48,31,19,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-42px_rgba(48,31,19,0.34)]">
      <Link
        to={href}
        className="relative block aspect-[4/4.75] overflow-hidden bg-[linear-gradient(135deg,#efe4d5,#f8f3ec)]"
      >
        {item.primaryImageUrl ? (
          <img
            src={item.primaryImageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#6b4c38]">
            {item.name}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <Badge
            variant="outline"
            className="border-white/70 bg-white/85 text-[#241913] shadow-sm backdrop-blur"
          >
            {item.badge ?? item.categoryName ?? "Catalog"}
          </Badge>
          {item.discountPercent > 0 ? (
            <div className="rounded-full bg-[#241913] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              {item.discountPercent}% off
            </div>
          ) : null}
        </div>
      </Link>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-xs font-medium uppercase tracking-[0.22em] text-[#866651]">
              {item.brandName ?? item.department ?? "Catalog"}
            </span>
            <span className="text-xs text-[#7d6150]">
              {isOutOfStock ? "Out of stock" : `${item.availableQuantity} in stock`}
            </span>
          </div>
          <Link
            to={href}
            className="line-clamp-2 text-lg font-semibold leading-snug text-[#241913] transition group-hover:text-[#3a291f]"
          >
            {item.name}
          </Link>
          {item.shortDescription ? (
            <p className="line-clamp-2 text-sm leading-6 text-[#6d5645]">
              {item.shortDescription}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[1.3rem] bg-white/76 px-4 py-3 ring-1 ring-[#efe5d9]">
          <div className="min-w-0">
            <div className="text-[1.05rem] font-semibold text-[#241913]">
              {formatCurrency(item.sellingPrice)}
            </div>
            {item.mrp > item.sellingPrice ? (
              <div className="text-xs text-[#8a6b55] line-through">
                {formatCurrency(item.mrp)}
              </div>
            ) : (
              <div className="text-xs text-[#8a6b55]">Regular price</div>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#7d6150]">
            {item.isNewArrival ? <Badge variant="secondary">New</Badge> : null}
            {item.isBestSeller ? <Badge variant="secondary">Best seller</Badge> : null}
          </div>
        </div>
      </CardContent>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-5 pt-0">
        <Button
          className="h-11 rounded-full bg-[#241913] text-white hover:bg-[#3a291f]"
          disabled={isOutOfStock}
          onClick={onAddToCart}
        >
          <ShoppingCart className="size-4" />
          {isOutOfStock ? "Out of stock" : "Add to Cart"}
        </Button>
        <div className="flex items-center gap-2 rounded-full bg-white/75 px-2 py-1 ring-1 ring-[#ece1d3]">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-full text-[#6d5140] hover:bg-white"
          >
            <Heart className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-full text-[#6d5140] hover:bg-white"
          >
            <Share2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
