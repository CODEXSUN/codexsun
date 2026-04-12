type RuntimeBrandLogoVariant = "primary" | "dark"
type RuntimeBrandLogo = {
  logoUrl?: string | null
  darkLogoUrl?: string | null
}

export function resolveRuntimeBrandLogoUrl(
  brand: RuntimeBrandLogo | null | undefined,
  variant: RuntimeBrandLogoVariant = "primary"
) {
  if (variant === "dark") {
    return brand?.darkLogoUrl ?? brand?.logoUrl ?? "/logo-dark.svg"
  }

  return brand?.logoUrl ?? "/logo.svg"
}
