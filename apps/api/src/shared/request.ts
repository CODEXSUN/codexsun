import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { HttpRouteHandlerContext } from "../../../framework/src/runtime/http/route-types.js"

export function readHeader(
  headers: HttpRouteHandlerContext["request"]["headers"],
  name: string
) {
  const value = headers[name]
  return Array.isArray(value) ? value[0] : value
}

export function readBearerToken(
  headers: HttpRouteHandlerContext["request"]["headers"]
) {
  const authorization = readHeader(headers, "authorization")

  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(" ")

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null
  }

  return token.trim()
}

export function requireJsonBody<T>(
  context: HttpRouteHandlerContext,
  guard: { parse: (value: unknown) => T }
) {
  if (context.request.jsonBody === null) {
    throw new ApplicationError("JSON request body is required.", {}, 400)
  }

  return guard.parse(context.request.jsonBody)
}

export function getRequestMeta(
  request: Pick<HttpRouteHandlerContext["request"], "headers" | "remoteAddress">
) {
  const forwardedFor = readHeader(request.headers, "x-forwarded-for")
  const userAgent = readHeader(request.headers, "user-agent")

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? request.remoteAddress ?? null,
    userAgent: userAgent?.trim() ?? null,
  }
}
