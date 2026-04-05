import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { getAuthenticatedCustomer } from "../../../ecommerce/src/services/customer-service.js"
import type { HttpRouteHandlerContext } from "../../../framework/src/runtime/http/route-types.js"

import { readBearerToken } from "./request.js"

export async function requireAuthenticatedCustomer(
  context: HttpRouteHandlerContext
) {
  const token = readBearerToken(context.request.headers)

  if (!token) {
    throw new ApplicationError("Authorization bearer token is required.", {}, 401)
  }

  const customer = await getAuthenticatedCustomer(
    context.databases.primary,
    context.config,
    token
  )

  return {
    token,
    customer,
  }
}
