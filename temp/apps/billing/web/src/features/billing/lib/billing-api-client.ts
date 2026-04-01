import type { BillingWorkspaceResponse } from '@billing-core/index'

const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL ?? '').trim()
const defaultLocalApiBaseUrl = 'http://localhost:4000'

function isViteLocalDevOrigin(origin: string) {
  try {
    const url = new URL(origin)
    return (
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      (url.port === '5173' || url.port === '5174')
    )
  } catch {
    return false
  }
}

function resolveApiBaseUrl() {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    if (isViteLocalDevOrigin(window.location.origin)) {
      return defaultLocalApiBaseUrl
    }

    return window.location.origin
  }

  return defaultLocalApiBaseUrl
}

export class BillingHttpError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly context?: unknown,
  ) {
    super(message)
    this.name = 'BillingHttpError'
  }
}

async function request<T>(path: string, token: string) {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: string; context?: unknown }
    | null

  if (!response.ok) {
    const context = payload && typeof payload === 'object' && 'context' in payload ? payload.context : undefined
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? payload.error
        : 'Request failed.'
    throw new BillingHttpError(message, response.status, context)
  }

  return payload as T
}

export async function getBillingWorkspace(token: string) {
  const response = await request<BillingWorkspaceResponse>('/admin/billing/workspace', token)
  return response.workspace
}
