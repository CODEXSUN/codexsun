import { lazy, Suspense } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"

const CouponBanner = lazy(async () => import("@/components/blocks/coupon-banner").then((module) => ({ default: module.CouponBanner })))
const GiftCorner = lazy(async () => import("@/components/blocks/gift-corner").then((module) => ({ default: module.GiftCorner })))

export function StorefrontHomeCouponBannerSection({ landing }: { landing: StorefrontLandingResponse }) {
  return (
    <StorefrontDeferredSection rootMargin={storefrontHomepageSectionPerformance.couponBanner.rootMargin} minHeightClassName={storefrontHomepageSectionPerformance.couponBanner.minHeightClassName} fallback={storefrontHomepageSectionPerformance.couponBanner.fallback}>
      <div className="relative" data-technical-name="section.storefront.home.coupon-banner">
        <StorefrontTechnicalNameBadge name="section.storefront.home.coupon-banner" />
        <Suspense fallback={null}>
          <CouponBanner config={landing.settings.couponBanner} />
        </Suspense>
      </div>
    </StorefrontDeferredSection>
  )
}

export function StorefrontHomeGiftCornerSection({ landing }: { landing: StorefrontLandingResponse }) {
  return (
    <StorefrontDeferredSection rootMargin={storefrontHomepageSectionPerformance.giftCorner.rootMargin} minHeightClassName={storefrontHomepageSectionPerformance.giftCorner.minHeightClassName} fallback={storefrontHomepageSectionPerformance.giftCorner.fallback}>
      <div className="relative" data-technical-name="section.storefront.home.gift-corner">
        <StorefrontTechnicalNameBadge name="section.storefront.home.gift-corner" />
        <Suspense fallback={null}>
          <GiftCorner config={landing.settings.giftCorner} />
        </Suspense>
      </div>
    </StorefrontDeferredSection>
  )
}

