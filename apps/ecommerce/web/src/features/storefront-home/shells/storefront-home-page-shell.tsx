import { StorefrontLayout } from "../../../components/storefront-layout"

export function StorefrontHomePageShell() {
  return (
    <StorefrontLayout
      showCategoryMenu
      showFooter
      showFloatingContact={false}
      className="pb-0"
    >
      {/* Temporary manual shell-testing mode: keep header shells visible for isolated review. */}
      <div className="hidden" data-technical-name="page.storefront.home" />
    </StorefrontLayout>
  )
}
