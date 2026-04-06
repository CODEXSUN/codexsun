import type { AuthUser } from "@cxapp/shared"

export {
  createAppSessionProfile,
  isAdminSurfaceUser,
  isCustomerSurfaceUser,
  isDeskSurfaceUser,
  isWebSurfaceUser,
  resolveAppSurface,
  resolveAuthenticatedHomePath,
  type AppLayoutKind,
  type AppSessionProfile,
  type AppSurface,
} from "./app-session-cache"

import {
  isCustomerSurfaceUser,
  isDeskSurfaceUser,
  isWebSurfaceUser,
  resolveAuthenticatedHomePath,
} from "./app-session-cache"

function isDeskPath(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin/dashboard")
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

  if (isDeskSurfaceUser(user) && (nextPath.startsWith("/profile") || nextPath.startsWith("/customer"))) {
    return homePath
  }

  return nextPath
}
