import { lazy, Suspense } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"

const CouponBanner = lazy(async () => import("@/components/blocks/coupon-banner").then((module) => ({ default: module.CouponBanner })))
const GiftCorner = lazy(async () => import("@/components/blocks/gift-corner").then((module) => ({ default: module.GiftCorner })))
const BrandStoryRail = lazy(async () => import("@/components/blocks/brand-story-rail").then((module) => ({ default: module.BrandStoryRail })))
const TrendingSection = lazy(async () => import("@/components/blocks/trending-section").then((module) => ({ default: module.TrendingSection })))

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

export function StorefrontHomeTrendingSection({ landing }: { landing: StorefrontLandingResponse }) {
  return (
    <StorefrontDeferredSection rootMargin={storefrontHomepageSectionPerformance.trending.rootMargin} minHeightClassName={storefrontHomepageSectionPerformance.trending.minHeightClassName} fallback={storefrontHomepageSectionPerformance.trending.fallback}>
      <div className="relative" data-technical-name="section.storefront.home.trending">
        <StorefrontTechnicalNameBadge name="section.storefront.home.trending" />
        <Suspense fallback={null}>
          <TrendingSection config={landing.settings.trendingSection} />
        </Suspense>
      </div>
    </StorefrontDeferredSection>
  )
}

export function StorefrontHomeBrandStoriesSection({ landing }: { landing: StorefrontLandingResponse }) {
  return (
    <StorefrontDeferredSection rootMargin={storefrontHomepageSectionPerformance.brandStories.rootMargin} minHeightClassName={storefrontHomepageSectionPerformance.brandStories.minHeightClassName} fallback={storefrontHomepageSectionPerformance.brandStories.fallback}>
      <div className="relative" data-technical-name="section.storefront.home.brand-stories">
        <StorefrontTechnicalNameBadge name="section.storefront.home.brand-stories" />
        <Suspense fallback={null}>
          <BrandStoryRail title={landing.settings.brandShowcase.title ?? "More Beauty To Love"} description={landing.settings.brandShowcase.description} cards={landing.settings.brandShowcase.cards ?? landing.brands} />
        </Suspense>
      </div>
    </StorefrontDeferredSection>
  )
}
