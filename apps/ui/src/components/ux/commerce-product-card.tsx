import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type CommerceProductCardDesign = {
  titleColor: string
  metaColor: string
  descriptionColor: string
  priceColor: string
  compareAtColor: string
  badgeBackgroundColor: string
  badgeTextColor: string
  secondaryBadgeText: string
  secondaryBadgeBackgroundColor: string
  secondaryBadgeTextColor: string
  primaryButtonLabel: string
  showPrimaryBadge: boolean
  showSecondaryBadge: boolean
  showBrandMeta: boolean
  showCategoryMeta: boolean
  showStockMeta: boolean
  showDescription: boolean
  showCompareAtPrice: boolean
  showPrimaryAction: boolean
  showSecondaryActions: boolean
}

type CommerceProductCardProps = {
  href: string
  name: string
  imageUrl: string | null
  badge?: string | null
  brandName?: string | null
  categoryName?: string | null
  shortDescription?: string | null
  amount: number
  compareAtAmount?: number | null
  availableQuantity?: number | null
  onAddToCart?: () => void
  density?: "default" | "compact" | "dense"
  className?: string
  design?: CommerceProductCardDesign
}

export function CommerceProductCard({
  href,
  name,
  imageUrl,
  badge,
  brandName,
  categoryName,
  shortDescription,
  amount,
  compareAtAmount,
  availableQuantity,
  onAddToCart,
  density = "default",
  className,
  design,
}: CommerceProductCardProps) {
  const isCompact = density === "compact"
  const isDense = density === "dense"
  const isOutOfStock = typeof availableQuantity === "number" ? availableQuantity <= 0 : false
  const hasCompareAt =
    Boolean(design?.showCompareAtPrice ?? true) &&
    typeof compareAtAmount === "number" &&
    compareAtAmount > amount
  const metaLabel =
    [
      design?.showBrandMeta !== false && brandName ? brandName : null,
      design?.showCategoryMeta !== false && categoryName ? categoryName : null,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || null
  const stockLabel =
    design?.showStockMeta !== false && typeof availableQuantity === "number"
      ? availableQuantity > 0
        ? `${availableQuantity} in stock`
        : "Out of stock"
      : null
  const imageFallbackLabel = badge ?? categoryName ?? name
  const cardRadiusClassName = isDense
    ? "rounded-[1.55rem]"
    : isCompact
      ? "rounded-[1.8rem]"
      : "rounded-[2rem]"
  const imageAspectClassName = isDense
    ? "aspect-[4/4.45]"
    : isCompact
      ? "aspect-[4/4.7]"
      : "aspect-[4/4.9]"
  const contentPaddingClassName = isDense ? "p-4" : isCompact ? "p-4.5" : "p-5"
  const primaryButtonLabel = design?.primaryButtonLabel ?? "Buy Now"

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-[#e9dccd] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,246,239,0.94)_100%)] py-0 shadow-[0_10px_26px_-22px_rgba(48,31,19,0.3)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_-28px_rgba(48,31,19,0.24)]",
        cardRadiusClassName,
        className
      )}
    >
      <div className={cn(isDense ? "p-3 pb-0" : "p-3.5 pb-0", isCompact && "p-3 pb-0")}>
        <Link
          to={href}
          className={cn(
            "relative block overflow-hidden rounded-[1.55rem] border border-[#e3d5c6] bg-[linear-gradient(180deg,#f5ede4_0%,#efe3d8_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
            imageAspectClassName
          )}
        >
          {badge ? (
            <Badge
              className={cn(
                "absolute left-4 top-4 z-10 rounded-full border border-[#e1d5c7] bg-white/92 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-[0_8px_18px_-16px_rgba(48,31,19,0.5)] backdrop-blur",
                isDense ? "left-3 top-3 px-2.5 py-1" : isCompact ? "left-3.5 top-3.5 px-2.5 py-1" : "px-3 py-1"
              )}
              style={{
                display: design?.showPrimaryBadge === false ? "none" : undefined,
                backgroundColor: design?.badgeBackgroundColor ?? "rgba(255,255,255,0.92)",
                color: design?.badgeTextColor ?? "#4f4339",
              }}
            >
              {badge}
            </Badge>
          ) : null}
          {design?.showSecondaryBadge !== false && design?.secondaryBadgeText ? (
            <Badge
              className={cn(
                "absolute right-4 top-4 z-10 rounded-full border border-transparent text-[10px] font-semibold uppercase tracking-[0.16em] shadow-[0_12px_22px_-18px_rgba(19,12,8,0.65)]",
                isDense ? "right-3 top-3 px-2.5 py-1" : isCompact ? "right-3.5 top-3.5 px-2.5 py-1" : "px-3 py-1"
              )}
              style={{
                backgroundColor: design.secondaryBadgeBackgroundColor || "#1f1813",
                color: design.secondaryBadgeTextColor || "#ffffff",
              }}
            >
              {design.secondaryBadgeText}
            </Badge>
          ) : null}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center text-[clamp(2rem,4vw,3.4rem)] font-semibold tracking-tight text-[#3d2c22]">
              {imageFallbackLabel}
            </div>
          )}
        </Link>
      </div>
      <CardContent className={cn("grid gap-4", contentPaddingClassName)}>
        <div className={cn("space-y-3", isDense && "space-y-2.5", isCompact && "space-y-2.5")}>
          {metaLabel || stockLabel ? (
            <div
              className={cn(
                "flex items-center justify-between gap-3",
                isDense ? "text-[10px]" : "text-[11px]"
              )}
            >
              <span
                className="truncate font-medium uppercase tracking-[0.18em]"
                style={{ color: design?.metaColor ?? "#8b715d" }}
              >
                {metaLabel ?? "-"}
              </span>
              {stockLabel ? (
                <span className="shrink-0 text-right" style={{ color: design?.metaColor ?? "#9a8170" }}>
                  {stockLabel}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className={cn("space-y-1.5", isDense && "space-y-1")}>
            <Link
              to={href}
              className={cn(
                "block font-semibold tracking-tight transition hover:opacity-85",
                isDense
                  ? "line-clamp-2 text-[1.05rem] leading-5"
                  : isCompact
                    ? "line-clamp-2 text-[1.1rem] leading-6"
                    : "line-clamp-2 text-[1.25rem] leading-[1.2]"
              )}
              style={{ color: design?.titleColor ?? "#241913" }}
            >
              {name}
            </Link>
            {design?.showDescription !== false && shortDescription ? (
              <p
                className={cn(
                  isDense
                    ? "line-clamp-2 text-[12px] leading-5"
                    : isCompact
                      ? "line-clamp-2 text-[13px] leading-5"
                      : "line-clamp-2 text-sm leading-6"
                )}
                style={{ color: design?.descriptionColor ?? "#7f695a" }}
              >
                {shortDescription}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span
              className={cn(
                "font-bold tracking-tight",
                isDense ? "text-[1.05rem]" : isCompact ? "text-[1.1rem]" : "text-[1.25rem]"
              )}
              style={{ color: design?.priceColor ?? "#241913" }}
            >
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(amount)}
            </span>
            {hasCompareAt ? (
              <span
                className={cn("ml-2 line-through", isDense ? "text-[11px]" : "text-sm")}
                style={{ color: design?.compareAtColor ?? "#9a8170" }}
              >
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(compareAtAmount!)}
              </span>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2.5",
            design?.showPrimaryAction !== false && design?.showSecondaryActions !== false && onAddToCart
              ? "justify-between"
              : "justify-end"
          )}
        >
          {design?.showSecondaryActions !== false && onAddToCart ? (
            <Button
              variant="outline"
              size={isDense ? "sm" : "default"}
              className={cn(
                "rounded-full border-[#d9ccbe] bg-white/92 text-[#4f4339] shadow-[0_10px_20px_-18px_rgba(48,31,19,0.38)] hover:border-[#cbbbab] hover:bg-white",
                isDense ? "h-9 px-4 text-[12px]" : "h-10 px-5"
              )}
              disabled={isOutOfStock}
              onClick={onAddToCart}
            >
              {isOutOfStock ? "Out of stock" : "Add to cart"}
            </Button>
          ) : null}
          {design?.showPrimaryAction !== false ? (
            <Button
              asChild
              size={isDense ? "sm" : "default"}
              className={cn(
                "rounded-full bg-[#1f1813] text-white shadow-[0_14px_30px_-18px_rgba(31,24,19,0.62)] hover:bg-[#2b221c]",
                isDense ? "h-9 px-4 text-[12px]" : "h-10 px-5"
              )}
            >
              <Link to={href} className={cn("gap-2", isDense && "gap-1.5")}>
                {primaryButtonLabel}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
          {design?.showPrimaryAction === false &&
          design?.showSecondaryActions === false &&
          !onAddToCart ? (
            <div />
          ) : null}
        </div>
        {hasCompareAt ? (
          <div className="text-xs font-medium text-[#5f8a54]">
            Save{" "}
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(compareAtAmount! - amount)}
          </div>
        ) : null}
      </CardContent>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-full rounded-[inherit] ring-1 ring-inset ring-white/65"
        )}
      />
    </Card>
  )
}
