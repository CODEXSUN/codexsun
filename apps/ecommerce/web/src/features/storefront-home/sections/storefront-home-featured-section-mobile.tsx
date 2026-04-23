import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"
import { StorefrontHomeSectionHeader } from "../blocks/storefront-home-section-header"
import { StorefrontHomeSectionShell } from "../blocks/storefront-home-section-shell"
import { FeaturedCardRowSurface } from "@/components/ux/featured-card-row-surface"

export function StorefrontHomeFeaturedSectionMobile({
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
    <section className="relative space-y-4" data-technical-name="section.storefront.home.featured" data-shell-mode="mobile">
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
        compact
      />
      <StorefrontHomeSectionShell>
        <FeaturedCardRowSurface
          cardsPerRow={section.cardsPerRow ?? 3}
          cardDesign={section.cardDesign}
          cardClassName="min-h-[33.75rem]"
          densityOverride="dense"
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
  )
}
