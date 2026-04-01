import type { AuthUser } from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { environment } from '@framework-core/runtime/config/environment'

export function assertSuperAdmin(user: AuthUser) {
  if (!user.isSuperAdmin) {
    throw new ApplicationError('Super admin access is required.', {}, 403)
  }
}

export function assertFrappeViewer(user: AuthUser) {
  if (user.actorType === 'customer') {
    throw new ApplicationError('Frappe routes are available only to backoffice users.', { actorType: user.actorType }, 403)
  }
}

export function getConfiguredFrappeConnection() {
  if (!environment.frappe.enabled || !environment.frappe.baseUrl || !environment.frappe.apiKey || !environment.frappe.apiSecret) {
    throw new ApplicationError(
      'Frappe integration is not configured. Open ERPNext Connection and save valid credentials first.',
      {},
      409,
    )
  }

  return environment.frappe
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null
    return [
      typeof payload?.message === 'string' ? payload.message : '',
      typeof payload?.exception === 'string' ? payload.exception : '',
      typeof payload?.exc_type === 'string' ? payload.exc_type : '',
      typeof payload?._server_messages === 'string' ? payload._server_messages : '',
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' | ') || `HTTP ${response.status}`
  }

  return (await response.text().catch(() => '')).trim() || `HTTP ${response.status}`
}

export async function requestFrappeJson(path: string, init?: RequestInit) {
  const connection = getConfiguredFrappeConnection()
  const headers = new Headers({
    authorization: `token ${connection.apiKey}:${connection.apiSecret}`,
    accept: 'application/json',
  })

  if (connection.siteName) {
    headers.set('x-frappe-site-name', connection.siteName)
  }

  if (init?.body) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(`${connection.baseUrl}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(connection.timeoutSeconds * 1000),
  })

  if (!response.ok) {
    throw new ApplicationError('Frappe request failed.', {
      detail: await readErrorMessage(response),
      statusCode: response.status,
    }, 502)
  }

  return response.json().catch(() => null) as Promise<Record<string, unknown> | null>
}
