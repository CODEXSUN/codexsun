import type { HttpRouteResponse } from "../../../framework/src/runtime/http/index.js"

export function jsonResponse(body: unknown, statusCode = 200): HttpRouteResponse {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  }
}

export function badRequestResponse(message: string): HttpRouteResponse {
  return jsonResponse({ message }, 400)
}
