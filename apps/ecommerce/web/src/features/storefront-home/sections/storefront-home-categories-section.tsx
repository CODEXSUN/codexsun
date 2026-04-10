import { useStorefrontIsMobileShell } from "../../../hooks/use-storefront-shell-mode"

import { StorefrontHomeCategoriesSectionDesktop } from "./storefront-home-categories-section-desktop"
import { StorefrontHomeCategoriesSectionMobile } from "./storefront-home-categories-section-mobile"

export function StorefrontHomeCategoriesSection(
  props: Parameters<typeof StorefrontHomeCategoriesSectionDesktop>[0]
) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontHomeCategoriesSectionMobile {...props} />
  }

  return <StorefrontHomeCategoriesSectionDesktop {...props} />
}
