import { lazy, Suspense } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionFrame } from "../blocks/storefront-home-section-frame"

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
        className="relative min-w-0 max-w-full overflow-x-clip overflow-y-visible"
        data-technical-name="section.storefront.home.brand-stories"
        data-shell-mode="desktop"
      >
        <StorefrontTechnicalNameBadge
          name="section.storefront.home.brand-stories"
          className="right-0 top-0"
        />
        <StorefrontHomeSectionFrame>
          <Suspense fallback={null}>
            <BrandStoryRail
              className="min-w-0 max-w-full overflow-x-clip overflow-y-visible"
              title={landing.settings.brandShowcase.title ?? "More Beauty To Love"}
              description={landing.settings.brandShowcase.description}
              cards={landing.settings.brandShowcase.cards}
            />
          </Suspense>
        </StorefrontHomeSectionFrame>
      </section>
    </StorefrontDeferredSection>
  )
}
