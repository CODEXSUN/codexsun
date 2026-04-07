import { createAuthService } from "../../../cxapp/src/services/service-factory.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { HttpRouteHandlerContext } from "../../../framework/src/runtime/http/route-types.js"

import { enforceAdminAccessPolicy, enforceInternalAccessPolicy } from "./ip-policy.js"
import { readBearerToken } from "./request.js"

export async function requireAuthenticatedUser(
  context: HttpRouteHandlerContext,
  options: {
    allowedActorTypes?: string[]
    requiredPermissionKeys?: string[]
  } = {}
) {
  enforceInternalAccessPolicy(context, context.config)

  const token = readBearerToken(context.request.headers)

  if (!token) {
    throw new ApplicationError("Authorization bearer token is required.", {}, 401)
  }

  const authService = createAuthService(context.databases.primary, context.config)
  const user = await authService.getAuthenticatedUser(token)

  if (
    options.allowedActorTypes &&
    options.allowedActorTypes.length > 0 &&
    !options.allowedActorTypes.includes(user.actorType)
  ) {
    throw new ApplicationError(
      "You are not allowed to access this route.",
      {
        actorType: user.actorType,
      },
      403
    )
  }

  if (
    options.requiredPermissionKeys &&
    options.requiredPermissionKeys.length > 0 &&
    !user.isSuperAdmin
  ) {
    const userPermissionKeys = new Set(user.permissions.map((permission) => permission.key))
    const missingPermissionKeys = options.requiredPermissionKeys.filter(
      (permissionKey) => !userPermissionKeys.has(permissionKey)
    )

    if (missingPermissionKeys.length > 0) {
      throw new ApplicationError(
        "You do not have permission to access this route.",
        {
          missingPermissionKeys,
        },
        403
      )
    }
  }

  if (user.actorType === "admin") {
    enforceAdminAccessPolicy(context, context.config)
  }

  return {
    token,
    user,
  }
}
