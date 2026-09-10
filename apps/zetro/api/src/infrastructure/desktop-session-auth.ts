import { timingSafeEqual } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../config.js'

const headerName = 'x-zetro-session-token'

export function registerDesktopSessionAuth(
  server: FastifyInstance,
  environment: ZetroEnvironment,
): void {
  const expected = environment.ZETRO_DESKTOP_SESSION_TOKEN
  const connectedAppToken = environment.ZETRO_CONNECTED_APP_TOKEN
  server.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0]
    if (path === '/api/v1/supervisor' || path?.startsWith('/api/v1/supervisor/')) {
      const token = environment.ZETRO_SUPERVISOR_TOKEN
      if (!token) return reply.code(503).send({ error: 'Supervisor access is disabled.' })
      if (
        request.headers.origin ||
        !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.ip)
      ) {
        return reply
          .code(403)
          .send({ error: 'Supervisor access requires a local non-browser client.' })
      }
      if (!matchesToken(request.headers.authorization, `Bearer ${token}`)) {
        return reply.code(401).send({ error: 'The supervisor token is missing or invalid.' })
      }
      return
    }
    if (request.method === 'OPTIONS' || request.url.startsWith('/health')) return
    if (request.method === 'POST' && request.url.startsWith('/api/v1/connected-apps/metrics')) {
      if (
        connectedAppToken &&
        matchesToken(request.headers['x-zetro-app-token'], connectedAppToken)
      ) {
        return
      }
      if (connectedAppToken) {
        return reply.code(401).send({ error: 'The connected application token is invalid.' })
      }
    }
    if (!expected || matchesToken(request.headers[headerName], expected)) return
    return reply.code(401).send({ error: 'The Zetro desktop session token is missing or invalid.' })
  })
}

export function matchesToken(value: string | string[] | undefined, expected: string): boolean {
  if (typeof value !== 'string') return false
  const received = Buffer.from(value)
  const target = Buffer.from(expected)
  return received.length === target.length && timingSafeEqual(received, target)
}
