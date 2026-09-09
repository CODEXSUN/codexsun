import { connectionResponseSchema, deviceCodeResponseSchema } from './settings.schema'
import type { CodexConnection, CodexDeviceCode } from './settings.types'
import { zetroFetch } from '../../lib/zetro-api'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function getCodexConnection(): Promise<CodexConnection> {
  const response = await zetroFetch(`${apiBaseUrl}/api/v1/settings/codex`)
  return readResponse(response, connectionResponseSchema).then(({ connection }) => connection)
}

export async function generateDeviceCode(): Promise<CodexDeviceCode> {
  const response = await zetroFetch(`${apiBaseUrl}/api/v1/settings/codex/device-code`, {
    method: 'POST',
  })
  return readResponse(response, deviceCodeResponseSchema).then(({ deviceCode }) => deviceCode)
}

export async function disconnectCodex(): Promise<CodexConnection> {
  const response = await zetroFetch(`${apiBaseUrl}/api/v1/settings/codex/disconnect`, {
    body: JSON.stringify({ confirm: true }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return readResponse(response, connectionResponseSchema).then(({ connection }) => connection)
}

export async function activateDeviceCode(
  loginId: string,
  userCode: string,
): Promise<CodexConnection> {
  const response = await zetroFetch(`${apiBaseUrl}/api/v1/settings/codex/activate`, {
    body: JSON.stringify({ loginId, userCode }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return readResponse(response, connectionResponseSchema).then(({ connection }) => connection)
}

async function readResponse<T>(
  response: Response,
  schema: { parse(value: unknown): T },
): Promise<T> {
  const payload = (await response.json()) as unknown
  if (!response.ok) throw new Error(readError(payload))
  return schema.parse(payload)
}

function readError(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const error = payload.error
    if (typeof error === 'string') return error
  }
  return 'Zetro could not update the Codex connection.'
}
