import { StorefrontFooterSurface } from "./storefront-footer-surface"
import { useStorefrontFooterData } from "./storefront-footer-shared"

export function StorefrontFooterDesktop() {
  const { brand, footer, supportEmail, supportPhone } = useStorefrontFooterData()

  if (!footer) {
    return null
  }

  return (
    <div className="relative" data-technical-name="shell.storefront.footer" data-shell-mode="desktop">
      <StorefrontFooterSurface
        brand={brand}
        footer={footer}
        supportEmail={supportEmail}
        supportPhone={supportPhone}
      />
    </div>
  )
}
