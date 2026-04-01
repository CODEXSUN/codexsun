import type { ServerResponse } from 'node:http'
import { environment } from '../config/environment'

function resolveResponseCorsOrigin(response: ServerResponse) {
  const existingOrigin = response.getHeader('access-control-allow-origin')
  return typeof existingOrigin === 'string' && existingOrigin.length > 0
    ? existingOrigin
    : environment.corsOrigin
}

export function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': resolveResponseCorsOrigin(response),
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    vary: 'Origin',
  })
  response.end(JSON.stringify(payload))
}

export function writeEmpty(response: ServerResponse, statusCode: number) {
  response.writeHead(statusCode, {
    'access-control-allow-origin': resolveResponseCorsOrigin(response),
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    vary: 'Origin',
  })
  response.end()
}

export function writeDownload(
  response: ServerResponse,
  statusCode: number,
  mediaType: string,
  fileName: string,
  payload: Buffer | string,
) {
  response.writeHead(statusCode, {
    'content-type': mediaType,
    'content-disposition': `attachment; filename="${fileName}"`,
    'access-control-allow-origin': resolveResponseCorsOrigin(response),
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    vary: 'Origin',
  })
  response.end(payload)
}
