import type { AuthUser } from "@cxapp/shared"

import { storefrontPaths } from "@ecommerce/web/src/lib/storefront-routes"

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

function isDeskPath(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin/dashboard")
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

export function resolvePostAuthPath(
  user: AuthUser | null | undefined,
  nextPath: string | null | undefined
) {
  const homePath = resolveAuthenticatedHomePath(user)

  if (!nextPath) {
    return homePath
  }

  if (isCustomerSurfaceUser(user) && isDeskPath(nextPath)) {
    return homePath
  }

  if (isWebSurfaceUser(user) && nextPath.startsWith("/dashboard/apps")) {
    return homePath
  }

  if (isWebSurfaceUser(user) && nextPath.startsWith("/dashboard/settings")) {
    return homePath
  }

  if (isWebSurfaceUser(user) && nextPath.startsWith("/dashboard/billing")) {
    return homePath
  }

  if (isWebSurfaceUser(user) && nextPath.startsWith("/admin/dashboard")) {
    return homePath
  }

  if (isDeskSurfaceUser(user) && nextPath.startsWith("/profile")) {
    return homePath
  }

  return nextPath
}
