import type { ServerResponse } from "node:http"

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  const payload = JSON.stringify(body)

  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload).toString(),
    ...headers,
  })
  response.end(payload)
}

export function sendBuffer(
  response: ServerResponse,
  statusCode: number,
  body: Buffer,
  headers: Record<string, string> = {}
) {
  response.writeHead(statusCode, {
    "content-length": body.byteLength.toString(),
    ...headers,
  })
  response.end(body)
}

export function redirect(
  response: ServerResponse,
  location: string,
  statusCode = 302
) {
  response.writeHead(statusCode, { location })
  response.end()
}
