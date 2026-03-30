import type { AuthUser } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

export function assertSuperAdmin(user: AuthUser) {
  if (!user.isSuperAdmin) {
    throw new ApplicationError("Super admin access is required.", {}, 403)
  }
}

export function assertFrappeViewer(user: AuthUser) {
  if (!["admin", "staff"].includes(user.actorType)) {
    throw new ApplicationError(
      "Frappe routes are available only to backoffice users.",
      {
        actorType: user.actorType,
      },
      403
    )
  }
}
