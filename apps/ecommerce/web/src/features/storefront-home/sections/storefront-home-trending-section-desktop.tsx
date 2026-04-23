import { lazy, Suspense } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionFrame } from "../blocks/storefront-home-section-frame"

const TrendingSection = lazy(async () =>
  import("@/components/blocks/trending-section").then((module) => ({
    default: module.TrendingSection,
  }))
)

export function StorefrontHomeTrendingSectionDesktop({
  landing,
}: {
  landing: StorefrontLandingResponse
}) {
  return (
    <StorefrontDeferredSection
      rootMargin={storefrontHomepageSectionPerformance.trending.rootMargin}
      minHeightClassName={storefrontHomepageSectionPerformance.trending.minHeightClassName}
      fallback={storefrontHomepageSectionPerformance.trending.fallback}
    >
      <section
        className="relative min-w-0 max-w-full overflow-hidden"
        data-technical-name="section.storefront.home.trending"
        data-shell-mode="desktop"
      >
        <StorefrontTechnicalNameBadge
          name="section.storefront.home.trending"
          className="right-0 top-0"
        />
        <StorefrontHomeSectionFrame>
          <Suspense fallback={null}>
            <TrendingSection
              className="min-w-0 max-w-full overflow-hidden"
              config={landing.settings.trendingSection}
            />
          </Suspense>
        </StorefrontHomeSectionFrame>
      </section>
    </StorefrontDeferredSection>
  )
}
