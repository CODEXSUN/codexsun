import http from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { customApiEnvironment } from '../config/environment'
import { handleHealthRequest } from '../modules/health/http/handle-health-request'
import { handleManifestRequest } from '../modules/manifest/http/handle-manifest-request'
import { writeJson } from '../shared/http/json-response'

function applyCors(response: ServerResponse) {
  response.setHeader('Access-Control-Allow-Origin', customApiEnvironment.corsOrigin)
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function resolveUrl(request: IncomingMessage) {
  return new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
}

export function createCustomApiServer() {
  return http.createServer((request, response) => {
    applyCors(response)

    if (request.method === 'OPTIONS') {
      response.writeHead(204)
      response.end()
      return
    }

    const url = resolveUrl(request)

    if (request.method === 'GET' && url.pathname === '/health') {
      handleHealthRequest(request, response)
      return
    }

    if (request.method === 'GET' && url.pathname === '/manifest') {
      handleManifestRequest(request, response)
      return
    }

    writeJson(response, 404, {
      message: 'Custom API route not found.',
      path: url.pathname,
    })
  })
}
