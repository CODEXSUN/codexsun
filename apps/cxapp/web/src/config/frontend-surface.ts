export const frontendSurfaceValues = ["site", "shop", "app"] as const

export type FrontendSurface = (typeof frontendSurfaceValues)[number]

export function normalizeFrontendSurface(
  value: string | undefined
): FrontendSurface {
  if (value === "site" || value === "shop" || value === "app") {
    return value
  }

  return "site"
}

export const frontendSurface = normalizeFrontendSurface(
  import.meta.env.VITE_FRONTEND_TARGET
)

export const isShopFrontendSurface = frontendSurface === "shop"
export const isAppFrontendSurface = frontendSurface === "app"
