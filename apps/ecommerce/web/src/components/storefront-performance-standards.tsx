import type { ReactNode } from "react"

import {
  StorefrontCategoryCardSkeleton,
  StorefrontProductCardSkeleton,
  StorefrontSectionHeadingSkeleton,
} from "./storefront-skeletons"

export type StorefrontHomepageSectionPerformanceRule = {
  defer: boolean
  rootMargin: string
  minHeightClassName: string
  fallback: ReactNode
}

function buildProductRailFallback(cardCount: number) {
  return (
    <div className="space-y-5">
      <StorefrontSectionHeadingSkeleton />
      <div className="grid gap-5 lg:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <StorefrontProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

function buildCategoryRailFallback(cardCount: number) {
  return (
    <div className="space-y-5">
      <StorefrontSectionHeadingSkeleton />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <StorefrontCategoryCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export const storefrontHomepageSectionPerformance = {
  featured: {
    defer: true,
    rootMargin: "320px 0px",
    minHeightClassName: "min-h-[420px]",
    fallback: buildProductRailFallback(3),
  },
  newArrivals: {
    defer: true,
    rootMargin: "340px 0px",
    minHeightClassName: "min-h-[420px]",
    fallback: buildProductRailFallback(3),
  },
  bestSellers: {
    defer: true,
    rootMargin: "360px 0px",
    minHeightClassName: "min-h-[420px]",
    fallback: buildProductRailFallback(3),
  },
  categories: {
    defer: true,
    rootMargin: "320px 0px",
    minHeightClassName: "min-h-[360px]",
    fallback: buildCategoryRailFallback(3),
  },
  couponBanner: {
    defer: true,
    rootMargin: "360px 0px",
    minHeightClassName: "min-h-[180px]",
    fallback: null,
  },
  giftCorner: {
    defer: true,
    rootMargin: "360px 0px",
    minHeightClassName: "min-h-[420px]",
    fallback: null,
  },
  discoveryBoard: {
    defer: true,
    rootMargin: "400px 0px",
    minHeightClassName: "min-h-[340px]",
    fallback: null,
  },
  visualStrip: {
    defer: true,
    rootMargin: "96px 0px",
    minHeightClassName: "min-h-[240px]",
    fallback: null,
  },
  trending: {
    defer: true,
    rootMargin: "96px 0px",
    minHeightClassName: "min-h-[460px]",
    fallback: null,
  },
  brandStories: {
    defer: true,
    rootMargin: "64px 0px",
    minHeightClassName: "min-h-[360px]",
    fallback: null,
  },
  campaignTrust: {
    defer: true,
    rootMargin: "420px 0px",
    minHeightClassName: "min-h-[520px]",
    fallback: null,
  },
} satisfies Record<string, StorefrontHomepageSectionPerformanceRule>
