import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionHeader } from "../blocks/storefront-home-section-header"
import { StorefrontHomeSectionShell } from "../blocks/storefront-home-section-shell"
import { CategoryCardGridSurface } from "@/components/ux/category-card-grid-surface"

export function StorefrontHomeCategoriesSectionMobile({
  landing,
  items,
}: {
  landing: StorefrontLandingResponse
  items: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; productCount: number; href: string }>
}) {
  const section = landing.settings.sections.categories

  return (
    <section className="relative space-y-4" data-technical-name="section.storefront.home.categories" data-shell-mode="mobile">
      <StorefrontTechnicalNameBadge
        name="section.storefront.home.categories"
        className="right-0 top-0"
      />
      <StorefrontHomeSectionHeader
        eyebrow={section.eyebrow}
        title={section.title}
        summary={section.summary}
        technicalName="block.storefront.home.categories.header"
        compact
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
  )
}
