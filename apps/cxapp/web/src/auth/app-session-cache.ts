import type { AuthUser } from "@cxapp/shared"
import { storefrontPaths } from "@ecommerce/web/src/lib/storefront-routes"

export type AppSurface = "guest" | "admin" | "customer" | "web" | "desk"
export type AppLayoutKind =
  | "public"
  | "admin-dashboard"
  | "customer-portal"
  | "web-dashboard"
  | "desk-dashboard"

export type AppSessionProfile = {
  email: string | null
  surface: AppSurface
  homePath: string
  loginPath: string
  layoutKind: AppLayoutKind
  isAuthenticated: boolean
  access: {
    admin: boolean
    customer: boolean
    web: boolean
    desk: boolean
  }
  behaviors: {
    useAdminShell: boolean
    useCustomerShell: boolean
    useWebDashboard: boolean
    useDeskDashboard: boolean
  }
}

export type CachedAppSessionState = {
  user: AuthUser | null
  profile: AppSessionProfile
}

const appSessionCacheStorageKey = "codexsun.app.session-profile"

export function isAdminSurfaceUser(user: AuthUser | null | undefined) {
  if (!user) {
    return false
  }

  return user.isSuperAdmin || user.actorType === "admin"
}

export function isCustomerSurfaceUser(user: AuthUser | null | undefined) {
  if (!user) {
    return false
  }

  return (
    user.actorType === "customer" ||
    user.roles.some((role) => role.key === "customer_portal")
  )
}

export function isWebSurfaceUser(user: AuthUser | null | undefined) {
  if (!user || isAdminSurfaceUser(user) || isCustomerSurfaceUser(user)) {
    return false
  }

  return (
    ["employee", "partner", "supplier", "vendor"].includes(user.actorType) ||
    user.roles.some((role) =>
      [
        "employee_portal",
        "partner_portal",
        "supplier_portal",
        "vendor_portal",
      ].includes(role.key)
    )
  )
}

export function isDeskSurfaceUser(user: AuthUser | null | undefined) {
  return Boolean(user) && !isCustomerSurfaceUser(user) && !isWebSurfaceUser(user)
}

export function resolveAppSurface(user: AuthUser | null | undefined): AppSurface {
  if (!user) {
    return "guest"
  }

  if (isAdminSurfaceUser(user)) {
    return "admin"
  }

  if (isCustomerSurfaceUser(user)) {
    return "customer"
  }

  if (isWebSurfaceUser(user)) {
    return "web"
  }

  return "desk"
}

export function resolveAuthenticatedHomePath(user: AuthUser | null | undefined) {
  if (!user) {
    return "/login"
  }

  if (isAdminSurfaceUser(user)) {
    return "/admin/dashboard"
  }

  if (isCustomerSurfaceUser(user)) {
    return storefrontPaths.account()
  }

  if (isWebSurfaceUser(user)) {
    return "/dashboard"
  }

  return "/dashboard"
}

export function createAppSessionProfile(
  user: AuthUser | null | undefined
): AppSessionProfile {
  const surface = resolveAppSurface(user)
  const homePath = resolveAuthenticatedHomePath(user)
  const access = {
    admin: isAdminSurfaceUser(user),
    customer: isCustomerSurfaceUser(user),
    web: isWebSurfaceUser(user),
    desk: isDeskSurfaceUser(user),
  }

  let layoutKind: AppLayoutKind = "public"

  if (access.admin) {
    layoutKind = "admin-dashboard"
  } else if (access.customer) {
    layoutKind = "customer-portal"
  } else if (access.web) {
    layoutKind = "web-dashboard"
  } else if (access.desk) {
    layoutKind = "desk-dashboard"
  }

  return {
    email: user?.email ?? null,
    surface,
    homePath,
    loginPath: "/login",
    layoutKind,
    isAuthenticated: Boolean(user),
    access,
    behaviors: {
      useAdminShell: access.admin || access.desk,
      useCustomerShell: access.customer,
      useWebDashboard: access.web,
      useDeskDashboard: access.desk,
    },
  }
}

export function readCachedAppSessionState(): CachedAppSessionState | null {
  if (typeof window === "undefined") {
    return null
  }

  const rawValue = window.sessionStorage.getItem(appSessionCacheStorageKey)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as CachedAppSessionState
  } catch {
    window.sessionStorage.removeItem(appSessionCacheStorageKey)
    return null
  }
}

export function persistCachedAppSessionState(user: AuthUser | null | undefined) {
  if (typeof window === "undefined") {
    return
  }

  const cachedState: CachedAppSessionState = {
    user: user ?? null,
    profile: createAppSessionProfile(user),
  }

  window.sessionStorage.setItem(
    appSessionCacheStorageKey,
    JSON.stringify(cachedState)
  )
}

export function clearCachedAppSessionState() {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.removeItem(appSessionCacheStorageKey)
}
