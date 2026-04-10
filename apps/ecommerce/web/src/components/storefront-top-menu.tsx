import { useStorefrontIsMobileShell } from "../hooks/use-storefront-shell-mode"

import { StorefrontTopMenuDesktop } from "./storefront-top-menu-desktop"
import { StorefrontTopMenuMobile } from "./storefront-top-menu-mobile"
import type { StorefrontTopMenuProps } from "./storefront-top-menu-shared"

export function StorefrontTopMenu({ isScrolled }: StorefrontTopMenuProps) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontTopMenuMobile isScrolled={isScrolled} />
  }

  return <StorefrontTopMenuDesktop isScrolled={isScrolled} />
}
