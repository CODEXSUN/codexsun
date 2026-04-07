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

export function htmlResponse(
  body: string,
  statusCode = 200,
  fileName?: string | null
): HttpRouteResponse {
  return {
    statusCode,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...(fileName
        ? { "content-disposition": `attachment; filename="${fileName}"` }
        : {}),
    },
    body,
  }
}

export function textResponse(
  body: string,
  contentType: string,
  statusCode = 200,
  fileName?: string | null
): HttpRouteResponse {
  return {
    statusCode,
    headers: {
      "content-type": contentType,
      ...(fileName
        ? { "content-disposition": `attachment; filename="${fileName}"` }
        : {}),
    },
    body,
  }
}
