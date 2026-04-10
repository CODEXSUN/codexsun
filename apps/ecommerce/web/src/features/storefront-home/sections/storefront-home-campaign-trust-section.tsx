import { useStorefrontIsMobileShell } from "../../../hooks/use-storefront-shell-mode"

import { StorefrontHomeCampaignTrustSectionDesktop } from "./storefront-home-campaign-trust-section-desktop"
import { StorefrontHomeCampaignTrustSectionMobile } from "./storefront-home-campaign-trust-section-mobile"

export function StorefrontHomeCampaignTrustSection(
  props: Parameters<typeof StorefrontHomeCampaignTrustSectionDesktop>[0]
) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontHomeCampaignTrustSectionMobile {...props} />
  }

  return <StorefrontHomeCampaignTrustSectionDesktop {...props} />
}
