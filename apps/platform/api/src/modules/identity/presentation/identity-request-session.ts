import type { FastifyRequest } from 'fastify'
import type { IdentityService } from '../application/identity.service.js'
import type { IdentityPortal } from '@codexsun/platform-contracts'

export function identityCookieName(portal: IdentityPortal): string {
  return `codexsun_${portal.replace('-', '_')}_session`
}

export function requestToken(
  request: Pick<FastifyRequest, 'headers' | 'cookies'>,
  cookieName: string,
): string | undefined {
  const authorization = request.headers.authorization
  return authorization === undefined
    ? request.cookies[cookieName]
    : authorization.match(/^Bearer ([^\s]+)$/i)?.[1]
}

/** Explicit bearer credentials take precedence over browser cookies, including on failure. */
export async function findRequestSession(
  service: Pick<IdentityService, 'resolveSession'>,
  request: Pick<FastifyRequest, 'headers' | 'cookies'>,
) {
  for (const portal of ['super-admin', 'administrator', 'regular'] as const) {
    const token = requestToken(request, identityCookieName(portal))
    const session = await service.resolveSession(portal, token)
    if (session) return session
  }
  return undefined
}
