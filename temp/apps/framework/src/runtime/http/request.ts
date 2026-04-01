import type { IncomingMessage } from 'node:http'
import { ApplicationError } from '../errors/application-error'

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: string[] = []

  for await (const chunk of request) {
    chunks.push(
      Buffer.isBuffer(chunk) ? chunk.toString('utf8') : Buffer.from(chunk).toString('utf8'),
    )
  }

  if (chunks.length === 0) {
    return {}
  }

  try {
    return JSON.parse(chunks.join('')) as unknown
  } catch {
    throw new ApplicationError('Invalid JSON body.', {}, 400)
  }
}

export function getBearerToken(request: IncomingMessage) {
  const authorizationHeader = request.headers.authorization

  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}
