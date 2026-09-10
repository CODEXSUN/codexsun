import {
  identityPortalSchema,
  identitySessionDataSchema,
  successEnvelopeSchema,
  type IdentityPortal,
} from '@codexsun/platform-contracts'
import { type ZodType } from 'zod'
import {
  identityAccessDecisionSchema,
  identityAccessRequirementSchema,
  type IdentityAccessRequirement,
} from './identity-access.js'

export type IdentityCredential = { kind: 'cookie' } | { kind: 'bearer'; token: string }

export class IdentityClientError extends Error {
  constructor(
    readonly code: 'UNAUTHENTICATED' | 'UNAVAILABLE' | 'INVALID_RESPONSE' | 'INVALID_CREDENTIAL',
    readonly status?: number,
  ) {
    super(
      code === 'UNAUTHENTICATED'
        ? 'Sign in is required.'
        : 'Identity access could not be verified.',
    )
  }
}

export class PlatformIdentityClient {
  private readonly origin: string
  private readonly timeoutMs: number
  private readonly fetcher: typeof fetch

  constructor(options: { origin: string; timeoutMs?: number; fetch?: typeof fetch }) {
    const url = new URL(options.origin)
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/' ||
      (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)))
    )
      throw new Error('Identity requires a trusted HTTPS origin or loopback development origin.')
    this.origin = url.origin
    this.timeoutMs = options.timeoutMs ?? 5000
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1 || this.timeoutMs > 30000)
      throw new Error('Identity timeout must be between 1 and 30000 milliseconds.')
    this.fetcher = options.fetch ?? fetch
  }

  async session(portal: IdentityPortal, credential: IdentityCredential, signal?: AbortSignal) {
    const data = await this.request(
      portal,
      'session',
      identitySessionDataSchema,
      credential,
      signal,
    )
    if (data.user.portal !== portal || Date.parse(data.expiresAt) <= Date.now())
      throw new IdentityClientError('INVALID_RESPONSE')
    return data
  }

  async authorize(
    portal: IdentityPortal,
    requirement: IdentityAccessRequirement,
    credential: IdentityCredential,
    signal?: AbortSignal,
  ) {
    const body = identityAccessRequirementSchema.parse(requirement)
    const data = await this.request(
      portal,
      'authorize',
      identityAccessDecisionSchema,
      credential,
      signal,
      body,
    )
    if (data.portal !== portal) throw new IdentityClientError('INVALID_RESPONSE')
    return data
  }

  private async request<T>(
    portal: IdentityPortal,
    action: string,
    schema: ZodType<T>,
    credential: IdentityCredential,
    signal?: AbortSignal,
    body?: IdentityAccessRequirement,
  ): Promise<T> {
    identityPortalSchema.parse(portal)
    const headers: Record<string, string> = { accept: 'application/json' }
    if (credential.kind === 'bearer') {
      if (!/^[A-Za-z0-9_-]{32,256}$/u.test(credential.token))
        throw new IdentityClientError('INVALID_CREDENTIAL')
      headers.authorization = `Bearer ${credential.token}`
    } else if (credential.kind !== 'cookie') throw new IdentityClientError('INVALID_CREDENTIAL')
    if (body) headers['content-type'] = 'application/json'
    const controller = new AbortController()
    const abort = () => controller.abort()
    if (signal?.aborted) abort()
    signal?.addEventListener('abort', abort, { once: true })
    const timer = setTimeout(abort, this.timeoutMs)
    const suffix = portal === 'regular' ? '' : portal === 'administrator' ? '/admin' : '/sa'
    try {
      const response = await this.fetcher(`${this.origin}/api/identity${suffix}/${action}`, {
        method: body ? 'POST' : 'GET',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: credential.kind === 'cookie' ? 'include' : 'omit',
        redirect: 'error',
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) {
        await response.body?.cancel()
        throw new IdentityClientError(
          response.status === 401 ? 'UNAUTHENTICATED' : 'UNAVAILABLE',
          response.status,
        )
      }
      if (
        response.status !== 200 ||
        !response.headers.get('content-type')?.toLowerCase().startsWith('application/json')
      ) {
        await response.body?.cancel()
        throw new IdentityClientError('INVALID_RESPONSE')
      }
      const parsed = successEnvelopeSchema(schema).safeParse(
        JSON.parse(await boundedText(response)),
      )
      if (!parsed.success) throw new IdentityClientError('INVALID_RESPONSE')
      return parsed.data.data
    } catch (error) {
      if (error instanceof IdentityClientError) throw error
      throw new IdentityClientError('UNAVAILABLE')
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
    }
  }
}

async function boundedText(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new IdentityClientError('INVALID_RESPONSE')
  const decoder = new TextDecoder()
  let text = ''
  let bytes = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) return text + decoder.decode()
      bytes += next.value.byteLength
      if (bytes > 65536) throw new IdentityClientError('INVALID_RESPONSE')
      text += decoder.decode(next.value, { stream: true })
    }
  } finally {
    await reader.cancel()
    reader.releaseLock()
  }
}
