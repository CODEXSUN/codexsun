import { lazy } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionHeader } from "../blocks/storefront-home-section-header"
import { StorefrontHomeSectionShell } from "../blocks/storefront-home-section-shell"

const CategoryCardGridSurface = lazy(async () => import("@/components/ux/category-card-grid-surface").then((module) => ({ default: module.CategoryCardGridSurface })))

export function StorefrontHomeCategoriesSectionDesktop({
  landing,
  items,
}: {
  landing: StorefrontLandingResponse
  items: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; productCount: number; href: string }>
}) {
  const section = landing.settings.sections.categories

  return (
    <StorefrontDeferredSection
      rootMargin={storefrontHomepageSectionPerformance.categories.rootMargin}
      minHeightClassName={storefrontHomepageSectionPerformance.categories.minHeightClassName}
      fallback={storefrontHomepageSectionPerformance.categories.fallback}
    >
      <section className="relative space-y-5" data-technical-name="section.storefront.home.categories" data-shell-mode="desktop">
        <StorefrontTechnicalNameBadge
          name="section.storefront.home.categories"
          className="right-0 top-0"
        />
        <StorefrontHomeSectionHeader
          eyebrow={section.eyebrow}
          title={section.title}
          summary={section.summary}
          technicalName="block.storefront.home.categories.header"
        />
        <StorefrontHomeSectionShell>
          <CategoryCardGridSurface
            items={items}
            cardsPerRow={section.cardsPerRow ?? 3}
            rowsToShow={section.rowsToShow ?? 1}
            cardDesign={section.cardDesign}
          />
        </StorefrontHomeSectionShell>
      </section>
    </StorefrontDeferredSection>
  )
}
