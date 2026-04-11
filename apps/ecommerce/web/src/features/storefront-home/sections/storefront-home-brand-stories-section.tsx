import { useStorefrontIsMobileShell } from "../../../hooks/use-storefront-shell-mode"

import { StorefrontHomeBrandStoriesSectionDesktop } from "./storefront-home-brand-stories-section-desktop"
import { StorefrontHomeBrandStoriesSectionMobile } from "./storefront-home-brand-stories-section-mobile"

export function StorefrontHomeBrandStoriesSection(
  props: Parameters<typeof StorefrontHomeBrandStoriesSectionDesktop>[0]
) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontHomeBrandStoriesSectionMobile {...props} />
  }

  return <StorefrontHomeBrandStoriesSectionDesktop {...props} />
}
