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

export function isDeskSurfaceUser(user: AuthUser | null | undefined) {
  return Boolean(user) && !isCustomerSurfaceUser(user)
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

  return "/dashboard"
}
