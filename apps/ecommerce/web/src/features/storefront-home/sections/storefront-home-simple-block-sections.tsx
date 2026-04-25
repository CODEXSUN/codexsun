import { lazy, Suspense } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionFrame } from "../blocks/storefront-home-section-frame"

const CouponBanner = lazy(async () => import("@/components/blocks/coupon-banner").then((module) => ({ default: module.CouponBanner })))
const GiftCorner = lazy(async () => import("@/components/blocks/gift-corner").then((module) => ({ default: module.GiftCorner })))
const DiscoveryBoard = lazy(async () =>
  import("@/components/blocks/discovery-board").then((module) => ({
    default: module.DiscoveryBoard,
  }))
)
const VisualStrip = lazy(async () =>
  import("@/components/blocks/visual-strip").then((module) => ({
    default: module.VisualStrip,
  }))
)

export function StorefrontHomeCouponBannerSection({ landing }: { landing: StorefrontLandingResponse }) {
  return (
    <StorefrontDeferredSection rootMargin={storefrontHomepageSectionPerformance.couponBanner.rootMargin} minHeightClassName={storefrontHomepageSectionPerformance.couponBanner.minHeightClassName} fallback={storefrontHomepageSectionPerformance.couponBanner.fallback}>
      <div className="relative min-w-0 max-w-full overflow-x-clip" data-technical-name="section.storefront.home.coupon-banner">
        <StorefrontTechnicalNameBadge name="section.storefront.home.coupon-banner" />
        <StorefrontHomeSectionFrame>
          <Suspense fallback={null}>
            <CouponBanner config={landing.settings.couponBanner} />
          </Suspense>
        </StorefrontHomeSectionFrame>
      </div>
    </StorefrontDeferredSection>
  )
}

export function StorefrontHomeGiftCornerSection({ landing }: { landing: StorefrontLandingResponse }) {
  return (
    <StorefrontDeferredSection rootMargin={storefrontHomepageSectionPerformance.giftCorner.rootMargin} minHeightClassName={storefrontHomepageSectionPerformance.giftCorner.minHeightClassName} fallback={storefrontHomepageSectionPerformance.giftCorner.fallback}>
      <div className="relative min-w-0 max-w-full overflow-x-clip" data-technical-name="section.storefront.home.gift-corner">
        <StorefrontTechnicalNameBadge name="section.storefront.home.gift-corner" />
        <StorefrontHomeSectionFrame>
          <Suspense fallback={null}>
            <GiftCorner config={landing.settings.giftCorner} />
          </Suspense>
        </StorefrontHomeSectionFrame>
      </div>
    </StorefrontDeferredSection>
  )
}

export function StorefrontHomeDiscoveryBoardSection({ landing }: { landing: StorefrontLandingResponse }) {
  return (
    <StorefrontDeferredSection rootMargin={storefrontHomepageSectionPerformance.discoveryBoard.rootMargin} minHeightClassName={storefrontHomepageSectionPerformance.discoveryBoard.minHeightClassName} fallback={storefrontHomepageSectionPerformance.discoveryBoard.fallback}>
      <div className="relative min-w-0 max-w-full overflow-x-clip" data-technical-name="section.storefront.home.discovery-board">
        <StorefrontTechnicalNameBadge name="section.storefront.home.discovery-board" />
        <StorefrontHomeSectionFrame>
          <Suspense fallback={null}>
            <DiscoveryBoard config={landing.settings.discoveryBoard} />
          </Suspense>
        </StorefrontHomeSectionFrame>
      </div>
    </StorefrontDeferredSection>
  )
}

export function StorefrontHomeVisualStripSection({ landing }: { landing: StorefrontLandingResponse }) {
  return (
    <StorefrontDeferredSection rootMargin={storefrontHomepageSectionPerformance.visualStrip.rootMargin} minHeightClassName={storefrontHomepageSectionPerformance.visualStrip.minHeightClassName} fallback={storefrontHomepageSectionPerformance.visualStrip.fallback}>
      <div className="relative min-w-0 max-w-full overflow-x-clip" data-technical-name="section.storefront.home.visual-strip">
        <StorefrontTechnicalNameBadge name="section.storefront.home.visual-strip" />
        <StorefrontHomeSectionFrame>
          <Suspense fallback={null}>
            <VisualStrip config={landing.settings.visualStrip} />
          </Suspense>
        </StorefrontHomeSectionFrame>
      </div>
    </StorefrontDeferredSection>
  )
}

