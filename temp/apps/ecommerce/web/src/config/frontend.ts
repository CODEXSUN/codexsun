export const frontendTargets = ["app", "web", "shop"] as const

export type FrontendTarget = (typeof frontendTargets)[number]
export type AppTarget = 'site' | 'ecommerce' | 'billing'

declare const __FRONTEND_TARGET__: string

function normalizeTarget(value: string | undefined): FrontendTarget {
  if (value === "app" || value === "web" || value === "shop") {
    return value
  }

  return "web"
}

function parseAppTarget(value: string | undefined): AppTarget | null {
  if (value === 'app') {
    return 'billing'
  }

  if (value === 'site' || value === 'ecommerce' || value === 'billing') {
    return value
  }

  return null
}

function resolveFrontendTargetFromAppTarget(appTarget: AppTarget | null): FrontendTarget | null {
  if (appTarget === 'site') {
    return 'web'
  }

  if (appTarget === 'ecommerce') {
    return 'shop'
  }

  if (appTarget === 'billing') {
    return 'app'
  }

  return null
}

export const appTarget = parseAppTarget(import.meta.env.VITE_APP_TARGET)

export const frontendTarget = normalizeTarget(
  resolveFrontendTargetFromAppTarget(appTarget)
    ?? (typeof __APP_MODE__ === "string"
      ? __APP_MODE__
      : typeof __FRONTEND_TARGET__ === "string"
        ? __FRONTEND_TARGET__
        : import.meta.env.VITE_FRONTEND_TARGET),
)

export const appDebug = Boolean(__APP_DEBUG__)
export const appSkipSetupCheck = Boolean(__APP_SKIP_SETUP_CHECK__)

export const frontendLabels: Record<FrontendTarget, string> = {
  app: "ERP Billing",
  web: "Portfolio Sites",
  shop: "Online Store",
}
