import type { StorefrontLandingResponse, StorefrontProductCard } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontProductCardGrid } from "../../../components/storefront-product-card-grid"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionHeader } from "../blocks/storefront-home-section-header"

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
  const performanceRule =
    technicalName === "section.storefront.home.new-arrivals"
      ? storefrontHomepageSectionPerformance.newArrivals
      : technicalName === "section.storefront.home.best-sellers"
        ? storefrontHomepageSectionPerformance.bestSellers
        : null

  const content = (
    <section className="relative space-y-5" data-technical-name={technicalName} data-shell-mode="desktop">
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
      <StorefrontProductCardGrid
        items={items}
        cardsPerRow={lane.cardsPerRow ?? 3}
        rowsToShow={lane.rowsToShow ?? 1}
        isWishlisted={isWishlisted}
        onToggleWishlist={(item) => void onToggleWishlist(item)}
        onAddToCart={onAddToCart}
      />
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
