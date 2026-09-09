import { zetroFetch } from '../../lib/zetro-api'
import {
  metricsSchema,
  operationsSettingsResponseSchema,
  worktreeListSchema,
} from './operations.schema'
import type { OperationsSettings } from './operations.types'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function getOperationsMetrics() {
  return read(await zetroFetch(`${apiBaseUrl}/api/v1/operations/metrics`), metricsSchema)
}
export async function getOperationsSettings() {
  return read(
    await zetroFetch(`${apiBaseUrl}/api/v1/operations/settings`),
    operationsSettingsResponseSchema,
  ).then(({ settings }) => settings)
}
export async function saveOperationsSettings(settings: OperationsSettings) {
  return read(
    await zetroFetch(`${apiBaseUrl}/api/v1/operations/settings`, request(settings, 'PATCH')),
    operationsSettingsResponseSchema,
  ).then(({ settings: saved }) => saved)
}
export async function listWorktrees() {
  return read(await zetroFetch(`${apiBaseUrl}/api/v1/worktrees`), worktreeListSchema).then(
    ({ worktrees }) => worktrees,
  )
}
export async function removeWorktree(path: string) {
  await read(await zetroFetch(`${apiBaseUrl}/api/v1/worktrees/remove`, request({ path })), {
    parse: (value) => value,
  })
}
export async function sweepWorktrees(retentionDays: number) {
  await read(await zetroFetch(`${apiBaseUrl}/api/v1/worktrees/sweep`, request({ retentionDays })), {
    parse: (value) => value,
  })
}
export async function downloadDiagnostics() {
  const response = await zetroFetch(`${apiBaseUrl}/api/v1/operations/diagnostics`)
  if (!response.ok) throw new Error('Zetro could not create diagnostics.')
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = `zetro-diagnostics-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function request(body: unknown, method: 'PATCH' | 'POST' = 'POST'): RequestInit {
  return {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method,
  }
}

async function read<T>(response: Response, schema: { parse(value: unknown): T }): Promise<T> {
  const payload = (await response.json()) as unknown
  if (!response.ok) throw new Error(readError(payload))
  return schema.parse(payload)
}

function readError(payload: unknown): string {
  return typeof payload === 'object' &&
    payload &&
    'error' in payload &&
    typeof payload.error === 'string'
    ? payload.error
    : 'Zetro operations are unavailable.'
}
