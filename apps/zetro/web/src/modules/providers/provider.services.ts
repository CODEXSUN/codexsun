import {
  providerConnectionTestResponseSchema,
  providerDeviceLoginResponseSchema,
  providerModelListResponseSchema,
  providerSelectionRequestSchema,
  providerSettingsResponseSchema,
  type ProviderConnectionTestResponse,
  type ProviderDeviceLoginResponse,
  type ProviderModel,
  type ProviderSelectionRequest,
  type ProviderSettingsResponse,
} from '@codexsun/zetro-contracts'

const baseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? 'http://127.0.0.1:6050').replace(/\/$/, '')

export async function fetchProviderSettings(): Promise<ProviderSettingsResponse> {
  return providerSettingsResponseSchema.parse(await request('/api/zetro/v1/providers'))
}

export async function saveProviderSelection(
  selection: ProviderSelectionRequest,
): Promise<ProviderSettingsResponse> {
  return providerSettingsResponseSchema.parse(
    await request('/api/zetro/v1/providers/default', {
      body: JSON.stringify(providerSelectionRequestSchema.parse(selection)),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    }),
  )
}

export async function fetchProviderModels(connectionId: string): Promise<ProviderModel[]> {
  const body = await request(`/api/zetro/v1/providers/${encodeURIComponent(connectionId)}/models`)
  return providerModelListResponseSchema.parse(body).models
}

export async function refreshCodexAccount(
  connectionId = 'codex-local',
): Promise<ProviderSettingsResponse> {
  return providerSettingsResponseSchema.parse(
    await request(`/api/zetro/v1/providers/${encodeURIComponent(connectionId)}/account`),
  )
}

export async function startCodexDeviceLogin(
  connectionId = 'codex-local',
): Promise<ProviderDeviceLoginResponse> {
  return providerDeviceLoginResponseSchema.parse(
    await request(`/api/zetro/v1/providers/${encodeURIComponent(connectionId)}/device-login`, {
      method: 'POST',
    }),
  )
}

export async function testProvider(connectionId: string): Promise<ProviderConnectionTestResponse> {
  return providerConnectionTestResponseSchema.parse(
    await request(`/api/zetro/v1/providers/${encodeURIComponent(connectionId)}/test`, {
      method: 'POST',
    }),
  )
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${baseUrl}${path}`, init)
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(readError(body) ?? 'The provider request failed.')
  return body
}

function readError(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const error = Reflect.get(body, 'error')
  return typeof error === 'string' ? error : undefined
}
