import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { BrandStoryRail } from "@/components/blocks/brand-story-rail"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"

export function StorefrontHomeBrandStoriesSectionMobile({
  landing,
}: {
  landing: StorefrontLandingResponse
}) {
  const section = landing.settings.brandShowcase
  const cards = section.cards

  if (section.enabled === false || cards.length === 0) {
    return null
  }

  return (
    <section
      className="relative min-w-0 max-w-full space-y-4 overflow-hidden"
      data-technical-name="section.storefront.home.brand-stories"
      data-shell-mode="mobile"
    >
      <StorefrontTechnicalNameBadge
        name="section.storefront.home.brand-stories"
        className="right-0 top-0"
      />
      <BrandStoryRail
        title={section.title ?? "More Beauty To Love"}
        description={section.description}
        cards={cards}
      />
    </section>
  )
}
