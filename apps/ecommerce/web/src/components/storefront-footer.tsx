import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"

import { useStorefrontShellData } from "../hooks/use-storefront-shell-data"
import { StorefrontFooterSurface } from "./storefront-footer-surface"

export function StorefrontFooter() {
  const { brand } = useRuntimeBrand()
  const { data } = useStorefrontShellData()
  const settings = data?.settings

  return settings?.footer ? (
    <StorefrontFooterSurface
      brand={brand}
      footer={settings.footer}
      supportEmail={settings.supportEmail}
      supportPhone={settings.supportPhone}
    />
  ) : null
}
