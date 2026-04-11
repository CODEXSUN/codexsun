import { useStorefrontIsMobileShell } from "../../../hooks/use-storefront-shell-mode"

import { StorefrontHomeTrendingSectionDesktop } from "./storefront-home-trending-section-desktop"
import { StorefrontHomeTrendingSectionMobile } from "./storefront-home-trending-section-mobile"

export function StorefrontHomeTrendingSection(
  props: Parameters<typeof StorefrontHomeTrendingSectionDesktop>[0]
) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontHomeTrendingSectionMobile {...props} />
  }

  return <StorefrontHomeTrendingSectionDesktop {...props} />
}
