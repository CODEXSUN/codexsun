import {
  gitDeliveryFlowListSchema,
  gitDeliveryFlowSchema,
  gitDeliveryPreviewSchema,
  globalSettingsResponseSchema,
  projectSettingsResponseSchema,
} from './git-delivery.schema'
import type {
  GitDeliveryFlowInput,
  GitDeliverySettings,
  ProjectGitDeliverySettings,
} from './git-delivery.types'
import { zetroFetch } from '../../lib/zetro-api'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function getGlobalGitDeliverySettings() {
  return read(
    await zetroFetch(`${apiBaseUrl}/api/v1/git-delivery/settings`),
    globalSettingsResponseSchema,
  )
}

export async function updateGlobalGitDeliverySettings(settings: GitDeliverySettings) {
  return read(
    await zetroFetch(`${apiBaseUrl}/api/v1/git-delivery/settings`, request('PATCH', settings)),
    globalSettingsResponseSchema,
  )
}

export async function getProjectGitDeliverySettings(projectId: string) {
  return read(await zetroFetch(projectUrl(projectId, 'settings')), projectSettingsResponseSchema)
}

export async function updateProjectGitDeliverySettings(
  projectId: string,
  settings: ProjectGitDeliverySettings,
) {
  return read(
    await zetroFetch(projectUrl(projectId, 'settings'), request('PATCH', settings)),
    projectSettingsResponseSchema,
  )
}

export async function previewGitDelivery(projectId: string, title: string) {
  const query = new URLSearchParams({ title })
  return read(
    await zetroFetch(`${projectUrl(projectId, 'preview')}?${query}`),
    gitDeliveryPreviewSchema,
  )
}

export async function listGitDeliveryFlows(projectId: string) {
  return read(await zetroFetch(projectUrl(projectId, 'flows')), gitDeliveryFlowListSchema)
}

export async function runGitDeliveryFlow(projectId: string, input: GitDeliveryFlowInput) {
  return read(
    await zetroFetch(projectUrl(projectId, 'flows'), request('POST', input)),
    gitDeliveryFlowSchema,
  )
}

function projectUrl(projectId: string, resource: string) {
  return `${apiBaseUrl}/api/v1/projects/${projectId}/git-delivery/${resource}`
}

function request(method: 'PATCH' | 'POST', body: unknown): RequestInit {
  return { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method }
}

async function read<T>(response: Response, schema: { parse(value: unknown): T }): Promise<T> {
  const text = await response.text()
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('Zetro Git delivery is unavailable.')
  }
  if (!response.ok) throw new Error(readError(payload))
  return schema.parse(payload)
}

function readError(payload: unknown) {
  return typeof payload === 'object' &&
    payload &&
    'error' in payload &&
    typeof payload.error === 'string'
    ? payload.error
    : 'Zetro could not complete the Git delivery request.'
}
