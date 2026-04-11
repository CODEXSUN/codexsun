import { lazy, Suspense } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"

const BrandStoryRail = lazy(async () =>
  import("@/components/blocks/brand-story-rail").then((module) => ({
    default: module.BrandStoryRail,
  }))
)

export function StorefrontHomeBrandStoriesSectionDesktop({
  landing,
}: {
  landing: StorefrontLandingResponse
}) {
  return (
    <StorefrontDeferredSection
      rootMargin={storefrontHomepageSectionPerformance.brandStories.rootMargin}
      minHeightClassName={storefrontHomepageSectionPerformance.brandStories.minHeightClassName}
      fallback={storefrontHomepageSectionPerformance.brandStories.fallback}
    >
      <section
        className="relative min-w-0 max-w-full overflow-hidden"
        data-technical-name="section.storefront.home.brand-stories"
        data-shell-mode="desktop"
      >
        <StorefrontTechnicalNameBadge
          name="section.storefront.home.brand-stories"
          className="right-0 top-0"
        />
        <Suspense fallback={null}>
          <BrandStoryRail
            className="min-w-0 max-w-full overflow-hidden"
            title={landing.settings.brandShowcase.title ?? "More Beauty To Love"}
            description={landing.settings.brandShowcase.description}
            cards={landing.settings.brandShowcase.cards ?? landing.brands}
          />
        </Suspense>
      </section>
    </StorefrontDeferredSection>
  )
}
