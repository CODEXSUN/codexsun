import { lazy } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionHeader } from "../blocks/storefront-home-section-header"
import { StorefrontHomeSectionShell } from "../blocks/storefront-home-section-shell"

const FeaturedCardRowSurface = lazy(async () => import("@/components/ux/featured-card-row-surface").then((module) => ({ default: module.FeaturedCardRowSurface })))

export function StorefrontHomeFeaturedSectionDesktop({
  landing,
  items,
  ctaHref,
  onAddToCart,
}: {
  landing: StorefrontLandingResponse
  items: StorefrontLandingResponse["featured"]
  ctaHref: string
  onAddToCart: (item: StorefrontLandingResponse["featured"][number]) => void
}) {
  const section = landing.settings.sections.featured

  return (
    <StorefrontDeferredSection
      rootMargin={storefrontHomepageSectionPerformance.featured.rootMargin}
      minHeightClassName={storefrontHomepageSectionPerformance.featured.minHeightClassName}
      fallback={storefrontHomepageSectionPerformance.featured.fallback}
    >
      <section className="relative space-y-5" data-technical-name="section.storefront.home.featured" data-shell-mode="desktop">
        <StorefrontTechnicalNameBadge
          name="section.storefront.home.featured"
          className="right-0 top-0"
        />
        <StorefrontHomeSectionHeader
          eyebrow={section.eyebrow}
          title={section.title}
          summary={section.summary}
          ctaLabel={section.ctaLabel}
          ctaHref={ctaHref}
          technicalName="block.storefront.home.featured.header"
        />
        <StorefrontHomeSectionShell>
          <FeaturedCardRowSurface
            cardsPerRow={section.cardsPerRow ?? 3}
            cardDesign={section.cardDesign}
            items={items.map((item) => ({
              id: item.id,
              href: `/products/${item.slug}`,
              name: item.name,
              imageUrl: item.primaryImageUrl,
              badge: item.badge ?? item.department,
              brandName: item.brandName,
              categoryName: item.categoryName,
              shortDescription: item.shortDescription,
              amount: item.sellingPrice,
              compareAtAmount: item.mrp > item.sellingPrice ? item.mrp : null,
              availableQuantity: item.availableQuantity,
              onAddToCart: () => onAddToCart(item),
            }))}
          />
        </StorefrontHomeSectionShell>
      </section>
    </StorefrontDeferredSection>
  )
}
