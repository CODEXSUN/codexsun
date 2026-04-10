import { useStorefrontIsMobileShell } from "../hooks/use-storefront-shell-mode"

import type { StorefrontLayoutProps } from "./storefront-layout-shared"
import { StorefrontLayoutDesktop } from "./storefront-layout-desktop"
import { StorefrontLayoutMobile } from "./storefront-layout-mobile"

export function StorefrontLayout({
  children,
  className,
  showCategoryMenu = true,
  showFloatingContact = true,
  showFooter = true,
}: StorefrontLayoutProps) {
  const isMobileShell = useStorefrontIsMobileShell()

  if (isMobileShell) {
    return (
      <StorefrontLayoutMobile
        className={className}
        showCategoryMenu={showCategoryMenu}
        showFloatingContact={showFloatingContact}
        showFooter={showFooter}
      >
        {children}
      </StorefrontLayoutMobile>
    )
  }

  return (
    <StorefrontLayoutDesktop
      className={className}
      showCategoryMenu={showCategoryMenu}
      showFloatingContact={showFloatingContact}
      showFooter={showFooter}
    >
      {children}
    </StorefrontLayoutDesktop>
  )
}
