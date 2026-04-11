import type { StorefrontHeaderProps } from "./storefront-header-shared"
import { useStorefrontHeaderScrollState } from "./storefront-header-shared"
import { StorefrontTechnicalNameBadge } from "./storefront-technical-name-badge"
import { StorefrontTopMenu } from "./storefront-top-menu"

export function StorefrontHeaderMobile({
  categories: _categories = [],
  showCategoryMenu: _showCategoryMenu = true,
}: StorefrontHeaderProps) {
  const { isCategoryCompact } = useStorefrontHeaderScrollState()

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      data-technical-name="shell.storefront.header"
      data-shell-mode="mobile"
    >
      <StorefrontTechnicalNameBadge
        name="shell.storefront.header"
        className="left-4 right-auto top-3"
      />
      <StorefrontTopMenu isScrolled={isCategoryCompact} />
    </header>
  )
}
