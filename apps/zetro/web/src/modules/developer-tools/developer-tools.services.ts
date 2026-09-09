import {
  gitActionResponseSchema,
  gitComparisonSchema,
  gitStatusSchema,
  globalSettingsResponseSchema,
  projectSettingsResponseSchema,
} from './developer-tools.schema'
import type { GitAction, ProjectToolSettings, ToolSettings } from './developer-tools.types'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function getGlobalToolSettings() {
  return read(
    await fetch(`${apiBaseUrl}/api/v1/developer-tools/settings`),
    globalSettingsResponseSchema,
  )
}
export async function updateGlobalToolSettings(settings: ToolSettings) {
  return read(
    await fetch(`${apiBaseUrl}/api/v1/developer-tools/settings`, request('PATCH', settings)),
    globalSettingsResponseSchema,
  )
}
export async function getProjectToolSettings(projectId: string) {
  return read(await fetch(projectUrl(projectId, 'settings')), projectSettingsResponseSchema)
}
export async function updateProjectToolSettings(projectId: string, settings: ProjectToolSettings) {
  return read(
    await fetch(projectUrl(projectId, 'settings'), request('PATCH', settings)),
    projectSettingsResponseSchema,
  )
}
export async function getGitStatus(projectId: string) {
  return read(await fetch(projectUrl(projectId, 'status')), gitStatusSchema)
}
export async function compareGitBranch(projectId: string, base: string) {
  const query = new URLSearchParams({ base })
  return read(await fetch(`${projectUrl(projectId, 'compare')}?${query}`), gitComparisonSchema)
}
export async function runGitAction(projectId: string, action: GitAction) {
  return read(
    await fetch(projectUrl(projectId, 'actions'), request('POST', action)),
    gitActionResponseSchema,
  )
}
export async function launchDeveloperTool(
  projectId: string,
  target: 'editor' | 'files' | 'terminal',
) {
  await read(await fetch(projectUrl(projectId, 'launch'), request('POST', { target })), {
    parse: (value) => value,
  })
}

function projectUrl(projectId: string, resource: string) {
  return `${apiBaseUrl}/api/v1/projects/${projectId}/developer-tools/${resource}`
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
    throw new Error('Zetro developer tools are unavailable.')
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
    : 'Zetro could not complete the developer tool request.'
}
