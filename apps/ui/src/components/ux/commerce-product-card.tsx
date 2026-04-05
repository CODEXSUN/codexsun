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
  const hasCompareAt =
    Boolean(design?.showCompareAtPrice ?? true) &&
    typeof compareAtAmount === "number" &&
    compareAtAmount > amount
  const metaItems = [
    design?.showBrandMeta !== false && brandName ? brandName : null,
    design?.showCategoryMeta !== false && categoryName ? categoryName : null,
    design?.showStockMeta !== false && typeof availableQuantity === "number"
      ? availableQuantity > 0
        ? `${availableQuantity} in stock`
        : "Out of stock"
      : null,
  ].filter(Boolean)

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/70 bg-card/90 py-0 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-border hover:shadow-lg",
        isDense ? "rounded-[1.15rem]" : isCompact ? "rounded-[1.3rem]" : "rounded-[1.6rem]",
        className
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden border-b border-border/60 bg-[linear-gradient(180deg,#f5ede4_0%,#efe3d8_100%)]",
          isDense ? "aspect-[4/4.55]" : isCompact ? "aspect-[4/4.8]" : "aspect-[4/5]"
        )}
      >
        {badge ? (
          <Badge
            className={cn(
              "absolute z-10 rounded-full border-none",
              isDense ? "left-2.5 top-2.5 px-2 py-0.5 text-[10px]" : isCompact ? "left-3 top-3 px-2.5 py-0.5 text-[10px]" : "left-4 top-4 px-3 py-1"
            )}
            style={{
              display: design?.showPrimaryBadge === false ? "none" : undefined,
              backgroundColor: design?.badgeBackgroundColor ?? undefined,
              color: design?.badgeTextColor ?? undefined,
            }}
          >
            {badge}
          </Badge>
        ) : null}
        {design?.showSecondaryBadge !== false && design?.secondaryBadgeText ? (
          <Badge
            className={cn(
              "absolute right-4 top-4 z-10 rounded-full border-none",
              isDense ? "px-2 py-0.5 text-[10px]" : isCompact ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1"
            )}
            style={{
              backgroundColor: design.secondaryBadgeBackgroundColor,
              color: design.secondaryBadgeTextColor,
            }}
          >
            {design.secondaryBadgeText}
          </Badge>
        ) : null}
        <img
          src={imageUrl ?? "https://placehold.co/900x1200/e8ddd1/2d211b?text=Catalog"}
          alt={name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <CardContent className={cn("grid", isDense ? "gap-2.5 p-3" : isCompact ? "gap-3 p-4" : "gap-4 p-5")}>
        <div className={cn("space-y-2", isDense && "space-y-1.5", isCompact && "space-y-1.5")}>
          {metaItems.length > 0 ? (
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 font-semibold uppercase tracking-[0.18em]",
                isDense ? "text-[10px]" : "text-xs"
              )}
              style={{ color: design?.metaColor ?? undefined }}
            >
              {metaItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
          <div className={cn("space-y-1", isDense && "space-y-0.5")}>
            <Link
              to={href}
              className={cn(
                "block font-heading font-semibold tracking-tight transition hover:text-primary",
                isDense ? "line-clamp-2 text-sm leading-5" : isCompact ? "line-clamp-2 text-base leading-6" : "text-xl"
              )}
              style={{ color: design?.titleColor ?? undefined }}
            >
              {name}
            </Link>
            {design?.showDescription !== false && shortDescription ? (
              <p
                className={cn(
                  "",
                  isDense ? "line-clamp-2 text-[11px] leading-4.5" : isCompact ? "line-clamp-2 text-xs leading-5" : "text-sm leading-6"
                )}
                style={{ color: design?.descriptionColor ?? undefined }}
              >
                {shortDescription}
              </p>
            ) : null}
          </div>
        </div>
        <div className={cn("flex items-center justify-between gap-3", isDense && "gap-2", isCompact && "gap-2.5")}>
          <div className="flex items-center gap-2">
            <span
              className="text-base font-semibold tracking-tight"
              style={{ color: design?.priceColor ?? undefined }}
            >
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(amount)}
            </span>
            {hasCompareAt ? (
              <span
                className="text-sm line-through"
                style={{ color: design?.compareAtColor ?? undefined }}
              >
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(compareAtAmount!)}
              </span>
            ) : null}
          </div>
          <div className={cn("flex items-center gap-2", isDense && "gap-1.5")}>
            {design?.showSecondaryActions !== false && onAddToCart ? (
              <Button variant="outline" size={isDense ? "sm" : "default"} onClick={onAddToCart}>
                Add to cart
              </Button>
            ) : null}
            {design?.showPrimaryAction !== false ? (
            <Button asChild size={isDense ? "sm" : "default"}>
              <Link to={href} className={cn("gap-2", isDense && "gap-1.5")}>
                {design?.primaryButtonLabel ?? "View"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
