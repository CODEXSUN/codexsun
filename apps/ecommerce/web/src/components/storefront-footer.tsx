import { useStorefrontIsMobileShell } from "../hooks/use-storefront-shell-mode"

import { StorefrontFooterDesktop } from "./storefront-footer-desktop"
import { StorefrontFooterMobile } from "./storefront-footer-mobile"

export function StorefrontFooter() {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return <StorefrontFooterMobile />
  }

  return <StorefrontFooterDesktop />
}
