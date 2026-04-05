import { Heart, Share2, ShoppingCart } from "lucide-react"
import { Link } from "react-router-dom"

import type { StorefrontProductCard as StorefrontProductCardType } from "@ecommerce/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@ui/lib/utils"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function resolveFallbackLabel(item: StorefrontProductCardType) {
  return item.promoTitle ?? item.name
}

const navIconButtonClassName =
  "size-10 rounded-full border-[#ddd4c9] bg-white/90 text-[#534a42] shadow-[0_16px_30px_-24px_rgba(58,34,18,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.08] hover:border-[#111111] hover:bg-white hover:text-[#111111] active:scale-[0.97]"

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
  const badgeLabel = item.badge ?? item.categoryName ?? "Catalog"
  const brandLabel = item.brandName ?? item.department ?? "Catalog"
  const stockLabel = isOutOfStock ? "Out of stock" : `${item.availableQuantity} in stock`
  const compareAtAmount = item.mrp > item.sellingPrice ? item.mrp : null
  const hasDiscount = Boolean(compareAtAmount)
  const secondaryActions = [
    { key: "cart", label: "Quick add", icon: ShoppingCart },
    { key: "share", label: "Share", icon: Share2 },
  ] as const

  return (
    <Card className="group overflow-hidden rounded-[2rem] border border-[#ece2d4] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,246,239,0.94)_100%)] py-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(48,31,19,0.22)]">
      <Link
        to={href}
        className="relative block aspect-[4/4.75] overflow-hidden bg-[linear-gradient(135deg,#f3eadf,#fbf7f2)]"
      >
        {item.primaryImageUrl ? (
          <img
            src={item.primaryImageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-foreground/60">
            {resolveFallbackLabel(item)}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="flex items-start gap-2">
            <Badge
              variant="outline"
              className="border-white/70 bg-white/85 text-[10px] font-medium uppercase tracking-[0.16em] text-foreground shadow-sm backdrop-blur"
            >
              {badgeLabel}
            </Badge>
            {hasDiscount ? (
              <div className="rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                Sale
              </div>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(navIconButtonClassName, "pointer-events-auto")}
            aria-label="Wishlist"
          >
            <Heart className="size-4" />
          </Button>
        </div>
      </Link>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-[#8b715d]">
              {brandLabel}
            </span>
            <span className="text-[11px] text-[#9a8170]">{stockLabel}</span>
          </div>
          <Link
            to={href}
            className="line-clamp-2 text-[1.2rem] font-bold leading-[1.2] tracking-tight text-foreground transition group-hover:text-foreground/85"
          >
            {item.name}
          </Link>
          {item.shortDescription ? (
            <p className="line-clamp-2 text-sm leading-6 text-[#7f695a]">
              {item.shortDescription}
            </p>
          ) : null}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[1.25rem] font-bold tracking-tight text-foreground">
                {formatCurrency(item.sellingPrice)}
              </span>
              {compareAtAmount ? (
                <span className="text-sm text-[#9a8170] line-through">
                  {formatCurrency(compareAtAmount)}
                </span>
              ) : null}
            </div>
          </div>
          {hasDiscount ? <span className="text-xs font-medium text-[#4e8b5c]">Save</span> : null}
        </div>
      </CardContent>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 pb-6 pt-0">
        <Button
          className="h-12 w-full rounded-full bg-foreground text-background transition duration-200 hover:-translate-y-0.5 hover:bg-foreground/90"
          disabled={isOutOfStock}
          onClick={onAddToCart}
        >
          <ShoppingCart className="size-4" />
          {isOutOfStock ? "Out of stock" : "Buy Now"}
        </Button>
        <div className="flex items-center gap-2">
          {secondaryActions.map((action) => {
            const Icon = action.icon

            return (
              <Button
                key={action.key}
                type="button"
                variant="outline"
                size="icon"
                className={cn(navIconButtonClassName, "shrink-0")}
                aria-label={action.label}
              >
                <Icon className="size-4" />
              </Button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
