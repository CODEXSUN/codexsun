import { useStorefrontIsMobileShell } from "../../../hooks/use-storefront-shell-mode"

import { StorefrontHomeProductLaneSectionDesktop } from "./storefront-home-product-lane-section-desktop"
import { StorefrontHomeProductLaneSectionMobile } from "./storefront-home-product-lane-section-mobile"

export function StorefrontHomeProductLaneSection(
  props: Parameters<typeof StorefrontHomeProductLaneSectionDesktop>[0]
) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontHomeProductLaneSectionMobile {...props} />
  }

  return <StorefrontHomeProductLaneSectionDesktop {...props} />
}
