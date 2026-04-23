import type { StorefrontLandingResponse, StorefrontProductCard } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontProductCardGrid } from "../../../components/storefront-product-card-grid"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionHeader } from "../blocks/storefront-home-section-header"
import { StorefrontHomeSectionShell } from "../blocks/storefront-home-section-shell"

export function StorefrontHomeProductLaneSectionDesktop({
  items,
  lane,
  onAddToCart,
  onToggleWishlist,
  ctaHref,
  isWishlisted,
  technicalName,
}: {
  items: StorefrontProductCard[]
  lane: StorefrontLandingResponse["settings"]["sections"]["newArrivals"] | StorefrontLandingResponse["settings"]["sections"]["bestSellers"]
  onAddToCart: (item: StorefrontProductCard) => void
  onToggleWishlist: (item: StorefrontProductCard) => void
  ctaHref: string
  isWishlisted: (productId: string) => boolean
  technicalName: string
}) {
  const isNewArrivalsLane = technicalName === "section.storefront.home.new-arrivals"
  const isBestSellersLane = technicalName === "section.storefront.home.best-sellers"
  const useTightLaneCards = isNewArrivalsLane || isBestSellersLane
  const laneCardClassName = isNewArrivalsLane
    ? "min-h-[38.75rem]"
    : isBestSellersLane
      ? "min-h-[40.625rem]"
      : undefined
  const performanceRule =
    isNewArrivalsLane
      ? storefrontHomepageSectionPerformance.newArrivals
      : technicalName === "section.storefront.home.best-sellers"
        ? storefrontHomepageSectionPerformance.bestSellers
        : null

  const content = (
    <section className="relative space-y-6 lg:space-y-7" data-technical-name={technicalName} data-shell-mode="desktop">
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
      />
      <StorefrontHomeSectionShell>
        <StorefrontProductCardGrid
          items={items}
          cardsPerRow={lane.cardsPerRow ?? 3}
          rowsToShow={lane.rowsToShow ?? 1}
          densityOverride={useTightLaneCards ? "dense" : undefined}
          cardClassName={laneCardClassName}
          isWishlisted={isWishlisted}
          onToggleWishlist={(item) => void onToggleWishlist(item)}
          onAddToCart={onAddToCart}
        />
      </StorefrontHomeSectionShell>
    </section>
  )

  if (!performanceRule?.defer) {
    return content
  }

  return (
    <StorefrontDeferredSection
      rootMargin={performanceRule.rootMargin}
      minHeightClassName={performanceRule.minHeightClassName}
      fallback={performanceRule.fallback}
    >
      {content}
    </StorefrontDeferredSection>
  )
}
