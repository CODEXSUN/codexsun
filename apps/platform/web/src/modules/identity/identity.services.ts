import type {
  IdentityLoginInput,
  IdentityManagedUser,
  IdentityRole,
  IdentityPortal,
  IdentitySessionData,
  IdentitySecurityEvent,
  IdentityUser,
} from '@codexsun/platform-contracts'

const apiBase = import.meta.env.VITE_PLATFORM_API_URL || 'http://127.0.0.1:6010'

export function login(portal: IdentityPortal, identifier: string, password: string) {
  const device = readDevice()
  const input: IdentityLoginInput = { device, identifier, password }
  return request<IdentitySessionData>(`${portalPath(portal)}/login`, {
    body: JSON.stringify(input),
    method: 'POST',
  })
}

export function devLogin() {
  const device = readDevice()
  return request<IdentitySessionData>('/api/identity/sa/dev-login', {
    body: JSON.stringify(device),
    method: 'POST',
  })
}

export function readSession(portal: IdentityPortal) {
  return request<IdentitySessionData>(`${portalPath(portal)}/session`)
}

export function readIdentityConfig() {
  return request<{
    devLoginEnabled: boolean
    otpProviderEnabled: boolean
    passwordMinimumLength: 8
    registrationEnabled: boolean
  }>('/api/identity/config')
}

export function listManagedUsers(portal: 'administrator' | 'super-admin') {
  return request<readonly IdentityManagedUser[]>(`${portalPath(portal)}/users`)
}

export function listSecurityEvents() {
  return request<readonly IdentitySecurityEvent[]>('/api/identity/sa/security-events?limit=100')
}

export function updateRegularUserStatus(userId: string, status: 'active' | 'disabled') {
  return request<{ updated: true }>(`/api/identity/admin/users/${userId}/status`, {
    body: JSON.stringify({ status }),
    method: 'PATCH',
  })
}

export function requestManagedPasswordReset(userId: string) {
  return request<{ accepted: true }>(`/api/identity/admin/users/${userId}/password-reset-request`, {
    body: '{}',
    method: 'POST',
  })
}

export function listRegularRoles() {
  return request<readonly IdentityRole[]>('/api/identity/admin/roles')
}

export function createRegularRole(name: string, permissions: readonly string[]) {
  return request<IdentityRole>('/api/identity/admin/roles', {
    body: JSON.stringify({ name, permissions }),
    method: 'POST',
  })
}

export function assignRegularUserRoles(userId: string, roleIds: readonly string[]) {
  return request<{ updated: true }>(`/api/identity/admin/users/${userId}/roles`, {
    body: JSON.stringify({ roleIds }),
    method: 'PUT',
  })
}

export function registerAccount(
  displayName: string,
  email: string,
  password: string,
  username?: string,
  mobile?: string,
) {
  return request<IdentityUser>('/api/identity/register', {
    body: JSON.stringify({ displayName, email, mobile, password, username }),
    method: 'POST',
  })
}

export function requestPasswordReset(identifier: string) {
  return request<{ accepted: true }>('/api/identity/password/forgot', {
    body: JSON.stringify({ identifier }),
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
  const issuedDeviceToken =
    response.headers.get('x-device-token') ??
    (payload.data as { deviceToken?: string } | undefined)?.deviceToken
  if (issuedDeviceToken) localStorage.setItem('codexsun.identity.device-token', issuedDeviceToken)
  if (!response.ok || !payload.data)
    throw new Error(payload.error?.message || 'The request failed.')
  return payload.data
}

function readDevice() {
  const key = 'codexsun.identity.device-id'
  let deviceId = localStorage.getItem(key)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(key, deviceId)
  }
  return {
    clientType: 'web' as const,
    deviceId,
    deviceName: navigator.platform || 'Web browser',
    deviceToken: localStorage.getItem('codexsun.identity.device-token') ?? undefined,
  }
}
