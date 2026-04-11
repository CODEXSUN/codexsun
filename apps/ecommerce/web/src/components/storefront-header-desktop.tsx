import { StorefrontCategoryMenu } from "./storefront-category-menu"
import type { StorefrontHeaderProps } from "./storefront-header-shared"
import { useStorefrontHeaderScrollState } from "./storefront-header-shared"
import { StorefrontTechnicalNameBadge } from "./storefront-technical-name-badge"
import { StorefrontTopMenu } from "./storefront-top-menu"

export function StorefrontHeaderDesktop({
  categories = [],
  showCategoryMenu = true,
}: StorefrontHeaderProps) {
  const { isCategoryCompact } = useStorefrontHeaderScrollState()

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      data-technical-name="shell.storefront.header"
      data-shell-mode="desktop"
    >
      <StorefrontTechnicalNameBadge
        name="shell.storefront.header"
        className="left-4 right-auto top-3"
      />
      <StorefrontTopMenu isScrolled={isCategoryCompact} />
      {showCategoryMenu ? (
        <div className="hidden md:block">
          <StorefrontCategoryMenu categories={categories} isScrolled={isCategoryCompact} />
        </div>
      ) : null}
    </header>
  )
}
