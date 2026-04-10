import { lazy, Suspense } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { StorefrontDeferredSection } from "../../../components/storefront-deferred-section"
import { storefrontHomepageSectionPerformance } from "../../../components/storefront-performance-standards"
import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"

const CampaignTrustSection = lazy(async () => import("@/components/blocks/campaign-trust-section").then((module) => ({ default: module.CampaignTrustSection })))

export function StorefrontHomeCampaignTrustSectionDesktop({
  landing,
  ctaPrimaryHref,
  ctaSecondaryHref,
}: {
  landing: StorefrontLandingResponse
  ctaPrimaryHref: string
  ctaSecondaryHref: string
}) {
  return (
    <StorefrontDeferredSection
      rootMargin={storefrontHomepageSectionPerformance.campaignTrust.rootMargin}
      minHeightClassName={storefrontHomepageSectionPerformance.campaignTrust.minHeightClassName}
      fallback={storefrontHomepageSectionPerformance.campaignTrust.fallback}
    >
      <div className="relative" data-technical-name="section.storefront.home.campaign-trust" data-shell-mode="desktop">
        <StorefrontTechnicalNameBadge
          name="section.storefront.home.campaign-trust"
          className="right-4 top-4"
        />
        <Suspense fallback={null}>
          <CampaignTrustSection
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
      </div>
    </StorefrontDeferredSection>
  )
}
