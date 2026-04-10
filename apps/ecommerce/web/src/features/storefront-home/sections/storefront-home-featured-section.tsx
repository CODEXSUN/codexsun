import { useStorefrontIsMobileShell } from "../../../hooks/use-storefront-shell-mode"

import { StorefrontHomeFeaturedSectionDesktop } from "./storefront-home-featured-section-desktop"
import { StorefrontHomeFeaturedSectionMobile } from "./storefront-home-featured-section-mobile"

export function StorefrontHomeFeaturedSection(
  props: Parameters<typeof StorefrontHomeFeaturedSectionDesktop>[0]
) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontHomeFeaturedSectionMobile {...props} />
  }

  return <StorefrontHomeFeaturedSectionDesktop {...props} />
}
