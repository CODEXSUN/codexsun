import type { StorefrontLandingResponse, StorefrontProductCard } from "@ecommerce/shared"

import { StorefrontProductCardGrid } from "../../../components/storefront-product-card-grid"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionHeader } from "../blocks/storefront-home-section-header"

export function StorefrontHomeProductLaneSectionMobile({
  items,
  lane,
  onAddToCart,
  onToggleWishlist,
  ctaHref,
  isWishlisted,
  technicalName,
}: {
  items: StorefrontProductCard[]
  lane:
    | StorefrontLandingResponse["settings"]["sections"]["newArrivals"]
    | StorefrontLandingResponse["settings"]["sections"]["bestSellers"]
  onAddToCart: (item: StorefrontProductCard) => void
  onToggleWishlist: (item: StorefrontProductCard) => void
  ctaHref: string
  isWishlisted: (productId: string) => boolean
  technicalName: string
}) {
  const isNewArrivalsLane = technicalName === "section.storefront.home.new-arrivals"
  const isBestSellersLane = technicalName === "section.storefront.home.best-sellers"
  const useTightLaneCards = isNewArrivalsLane || isBestSellersLane
  const laneCardClassName = useTightLaneCards ? "min-h-0" : undefined
  const laneImageAspectClassName = useTightLaneCards
    ? "aspect-[4/4.9] bg-[linear-gradient(135deg,#eedecb,#faf2e8)]"
    : undefined

  return (
    <section
      className="relative space-y-4"
      data-technical-name={technicalName}
      data-shell-mode="mobile"
    >
      <StorefrontTechnicalNameBadge
        name={technicalName}
        className="right-0 top-0"
      />
      <StorefrontHomeSectionHeader
        eyebrow={lane.eyebrow}
        title={lane.title}
        summary={lane.summary}
        ctaLabel={lane.ctaLabel}
        ctaHref={ctaHref}
        technicalName={`${technicalName}.header`}
        compact
      />
      <StorefrontProductCardGrid
        items={items}
        cardsPerRow={lane.cardsPerRow ?? 3}
        rowsToShow={lane.rowsToShow ?? 1}
        densityOverride={useTightLaneCards ? "dense" : undefined}
        cardClassName={laneCardClassName}
        imageAspectClassName={laneImageAspectClassName}
        isWishlisted={isWishlisted}
        onToggleWishlist={(item) => void onToggleWishlist(item)}
        onAddToCart={onAddToCart}
      />
    </section>
  )
}
