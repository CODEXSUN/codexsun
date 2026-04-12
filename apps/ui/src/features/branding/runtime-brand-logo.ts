type RuntimeBrandLogoVariant = "primary" | "dark"
type RuntimeBrandLogo = {
  logoUrl?: string | null
  darkLogoUrl?: string | null
}

export function resolveRuntimeBrandLogoVariant(
  requestedVariant: RuntimeBrandLogoVariant | null | undefined
): RuntimeBrandLogoVariant {
  return requestedVariant === "dark" ? "dark" : "primary"
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
