import { Heart, Share2, ShoppingCart } from "lucide-react"
import { Link, type To } from "react-router-dom"

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
  isWishlisted = false,
  onToggleWishlist,
  density = "default",
  className,
}: {
  item: StorefrontProductCardType
  href: string
  onAddToCart: () => void
  isWishlisted?: boolean
  onToggleWishlist?: () => void
  density?: "default" | "compact"
  className?: string
}) {
  const isCompact = density === "compact"
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

  const detailLink: To = {
    pathname: href,
    hash: "#product-detail",
  }

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border border-[#ece2d4] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,246,239,0.94)_100%)] py-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(48,31,19,0.22)]",
        isCompact
          ? "rounded-[1.65rem] border-[#e7d7c5] bg-[linear-gradient(180deg,rgba(255,251,246,0.98)_0%,rgba(247,239,229,0.96)_48%,rgba(244,235,224,0.94)_100%)] shadow-[0_12px_30px_-24px_rgba(69,41,18,0.38)] hover:shadow-[0_22px_48px_-26px_rgba(69,41,18,0.42)]"
          : "rounded-[2rem]",
        className
      )}
    >
      <Link
        to={detailLink}
        state={{ focus: "product-detail" }}
        className={cn(
          "relative block overflow-hidden bg-[linear-gradient(135deg,#f3eadf,#fbf7f2)]",
          isCompact
            ? "aspect-[4/4.02] bg-[linear-gradient(135deg,#eee0cf,#fbf5ed)]"
            : "aspect-[4/4.35]"
        )}
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
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between",
            isCompact ? "p-3" : "p-4"
          )}
        >
          <div className="flex items-start gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.16em] shadow-sm backdrop-blur",
                isCompact
                  ? "border-[#f7ecde] bg-[#fff8f1]/92 text-[#7f5539]"
                  : "border-white/70 bg-white/85 text-foreground"
              )}
            >
              {badgeLabel}
            </Badge>
            {hasDiscount ? (
              <div
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white",
                  isCompact ? "bg-[#8d5f3b]" : "bg-foreground"
                )}
              >
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
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onToggleWishlist?.()
            }}
          >
            <Heart className={cn("size-4", isWishlisted ? "fill-current text-rose-600" : undefined)} />
          </Button>
        </div>
        {isCompact ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#2d1708]/18 via-transparent to-transparent" />
        ) : null}
      </Link>
      <CardContent className={cn("flex flex-1 flex-col", isCompact ? "space-y-2.5 p-4" : "space-y-3 p-5")}>
        <div className={cn("flex flex-1 flex-col", isCompact ? "space-y-2" : "space-y-2.5")}>
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "truncate text-[11px] font-medium uppercase tracking-[0.18em]",
                isCompact ? "text-[#9a6a4a]" : "text-[#8b715d]"
              )}
            >
              {brandLabel}
            </span>
            <span className={cn("text-[11px]", isCompact ? "text-[#a0826c]" : "text-[#9a8170]")}>
              {stockLabel}
            </span>
          </div>
          <Link
            to={detailLink}
            state={{ focus: "product-detail" }}
            className={cn(
              "line-clamp-2 font-bold leading-[1.2] tracking-tight text-foreground transition group-hover:text-foreground/85",
              isCompact ? "text-[1rem]" : "text-[1.2rem]"
            )}
          >
            {item.name}
          </Link>
          {item.shortDescription ? (
            <p
              className={cn(
                "line-clamp-2",
                isCompact
                  ? "text-[13px] leading-5 text-[#8c6c57]"
                  : "text-sm leading-[1.4rem] text-[#7f695a]"
              )}
            >
              {item.shortDescription}
            </p>
          ) : null}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-bold tracking-tight",
                  isCompact ? "text-[1.05rem] text-[#2f1e12]" : "text-[1.25rem] text-foreground"
                )}
              >
                {formatCurrency(item.sellingPrice)}
              </span>
              {compareAtAmount ? (
                <span
                  className={cn(
                    "line-through text-[#9a8170]",
                    isCompact ? "text-xs" : "text-sm"
                  )}
                >
                  {formatCurrency(compareAtAmount)}
                </span>
              ) : null}
            </div>
          </div>
          {hasDiscount ? (
            <span className={cn("text-xs font-medium", isCompact ? "text-[#5f8a54]" : "text-[#4e8b5c]")}>
              Save
            </span>
          ) : null}
        </div>
      </CardContent>
      <div
        className={cn(
          "mt-auto grid grid-cols-[1fr_auto] items-center gap-3 pt-0",
          isCompact ? "px-4 pb-4" : "px-5 pb-5"
        )}
      >
        <Button
          className={cn(
            "w-full rounded-full bg-foreground text-background transition duration-200 hover:-translate-y-0.5 hover:bg-foreground/90",
            isCompact ? "h-10 bg-[#2d1708] text-xs shadow-[0_12px_24px_-16px_rgba(45,23,8,0.6)]" : "h-11"
          )}
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
