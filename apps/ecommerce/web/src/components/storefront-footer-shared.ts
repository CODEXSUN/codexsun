import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"

import { useStorefrontShellData } from "../hooks/use-storefront-shell-data"

export function useStorefrontFooterData() {
  const { brand } = useRuntimeBrand()
  const { data } = useStorefrontShellData()
  const settings = data?.settings

  return {
    brand,
    footer: settings?.footer ?? null,
    menuDesign: settings?.menuDesigner.footerMenu ?? null,
    supportEmail: settings?.supportEmail,
    supportPhone: settings?.supportPhone,
  }
}
