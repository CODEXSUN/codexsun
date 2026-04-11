import { lazy, Suspense } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"

const CampaignTrustSection = lazy(async () =>
  import("@/components/blocks/campaign-trust-section").then((module) => ({
    default: module.CampaignTrustSection,
  }))
)

export function StorefrontHomeCampaignTrustSectionMobile({
  landing,
  ctaPrimaryHref,
  ctaSecondaryHref,
}: {
  landing: StorefrontLandingResponse
  ctaPrimaryHref: string
  ctaSecondaryHref: string
}) {
  return (
    <section
      className="relative min-w-0 max-w-full overflow-hidden"
      data-technical-name="section.storefront.home.campaign-trust"
      data-shell-mode="mobile"
    >
      <StorefrontTechnicalNameBadge
        name="section.storefront.home.campaign-trust"
        className="right-4 top-4"
      />
      <Suspense fallback={null}>
        <CampaignTrustSection
          className="min-w-0 max-w-full overflow-hidden"
          campaign={{
            ...landing.settings.sections.cta,
            primaryCtaHref: ctaPrimaryHref,
            secondaryCtaHref: ctaSecondaryHref,
          }}
          trustNotes={landing.settings.trustNotes}
          design={landing.settings.campaignDesign}
          visibility={{
            cta: landing.settings.visibility.cta,
            trust: landing.settings.visibility.trust,
          }}
        />
      </Suspense>
    </section>
  )
}
