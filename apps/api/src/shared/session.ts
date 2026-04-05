import { createAuthService } from "../../../cxapp/src/services/service-factory.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { HttpRouteHandlerContext } from "../../../framework/src/runtime/http/route-types.js"

import { readBearerToken } from "./request.js"

export async function requireAuthenticatedUser(
  context: HttpRouteHandlerContext,
  options: {
    allowedActorTypes?: string[]
  } = {}
) {
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

  return {
    token,
    user,
  }
}
