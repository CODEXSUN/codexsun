import { useStorefrontIsMobileShell } from "../hooks/use-storefront-shell-mode"

import { StorefrontHeaderDesktop } from "./storefront-header-desktop"
import { StorefrontHeaderMobile } from "./storefront-header-mobile"
import type { StorefrontHeaderProps } from "./storefront-header-shared"

export function StorefrontHeader({
  categories = [],
  showCategoryMenu = true,
}: StorefrontHeaderProps) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontHeaderMobile categories={categories} showCategoryMenu={showCategoryMenu} />
  }

  return <StorefrontHeaderDesktop categories={categories} showCategoryMenu={showCategoryMenu} />
}
