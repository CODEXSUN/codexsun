import type {
  IdentityLoginInput,
  IdentityPortal,
  IdentitySessionData,
  IdentityUser,
} from '@codexsun/platform-contracts'

const apiBase = import.meta.env.VITE_PLATFORM_API_URL || 'http://127.0.0.1:6010'

export function login(portal: IdentityPortal, input: IdentityLoginInput) {
  return request<IdentitySessionData>(`${portalPath(portal)}/login`, {
    body: JSON.stringify(input),
    method: 'POST',
  })
}

export function devLogin() {
  return request<IdentitySessionData>('/api/identity/sa/dev-login', {
    body: '{}',
    method: 'POST',
  })
}

export function readSession(portal: IdentityPortal) {
  return request<IdentitySessionData>(`${portalPath(portal)}/session`)
}

export function readIdentityConfig() {
  return request<{ devLoginEnabled: boolean; registrationEnabled: boolean }>('/api/identity/config')
}

export function registerAccount(displayName: string, email: string, password: string) {
  return request<IdentityUser>('/api/identity/register', {
    body: JSON.stringify({ displayName, email, password }),
    method: 'POST',
  })
}

export function requestPasswordReset(email: string) {
  return request<{ accepted: true }>('/api/identity/password/forgot', {
    body: JSON.stringify({ email }),
    method: 'POST',
  })
}

function portalPath(portal: IdentityPortal): string {
  if (portal === 'super-admin') return '/api/identity/sa'
  if (portal === 'administrator') return '/api/identity/admin'
  return '/api/identity'
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  const payload = (await response.json()) as { data?: T; error?: { message?: string } }
  if (!response.ok || !payload.data)
    throw new Error(payload.error?.message || 'The request failed.')
  return payload.data
}
