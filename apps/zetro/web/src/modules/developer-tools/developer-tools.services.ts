import {
  gitActionResponseSchema,
  gitComparisonSchema,
  gitStatusSchema,
  globalSettingsResponseSchema,
  projectSettingsResponseSchema,
  blameSchema,
  branchesSchema,
  changedFilesSchema,
  conflictsSchema,
  fileDiffSchema,
  historySchema,
  pullRequestResponseSchema,
  scriptsSchema,
  stashesSchema,
} from './developer-tools.schema'
import type { GitAction, ProjectToolSettings, ToolSettings } from './developer-tools.types'
import { zetroFetch } from '../../lib/zetro-api'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function getGlobalToolSettings() {
  return read(
    await zetroFetch(`${apiBaseUrl}/api/v1/developer-tools/settings`),
    globalSettingsResponseSchema,
  )
}
export async function updateGlobalToolSettings(settings: ToolSettings) {
  return read(
    await zetroFetch(`${apiBaseUrl}/api/v1/developer-tools/settings`, request('PATCH', settings)),
    globalSettingsResponseSchema,
  )
}
export async function getProjectToolSettings(projectId: string) {
  return read(await zetroFetch(projectUrl(projectId, 'settings')), projectSettingsResponseSchema)
}
export async function updateProjectToolSettings(projectId: string, settings: ProjectToolSettings) {
  return read(
    await zetroFetch(projectUrl(projectId, 'settings'), request('PATCH', settings)),
    projectSettingsResponseSchema,
  )
}
export async function getGitStatus(projectId: string) {
  return read(await zetroFetch(projectUrl(projectId, 'status')), gitStatusSchema)
}
export async function compareGitBranch(projectId: string, base: string) {
  const query = new URLSearchParams({ base })
  return read(await zetroFetch(`${projectUrl(projectId, 'compare')}?${query}`), gitComparisonSchema)
}
export async function runGitAction(projectId: string, action: GitAction) {
  return read(
    await zetroFetch(projectUrl(projectId, 'actions'), request('POST', action)),
    gitActionResponseSchema,
  )
}
export async function launchDeveloperTool(
  projectId: string,
  target: 'editor' | 'files' | 'terminal',
) {
  await read(await zetroFetch(projectUrl(projectId, 'launch'), request('POST', { target })), {
    parse: (value) => value,
  })
}

export async function getChangedFiles(projectId: string) {
  return read(await zetroFetch(projectUrl(projectId, 'changes')), changedFilesSchema).then(
    (value) => value.files,
  )
}
export async function getFileDiff(projectId: string, path: string, staged = false) {
  const query = new URLSearchParams({ path, staged: String(staged) })
  return read(await zetroFetch(`${projectUrl(projectId, 'diff')}?${query}`), fileDiffSchema)
}
export async function setChangeStaged(
  projectId: string,
  path: string,
  staged: boolean,
  hunk?: number,
) {
  return read(
    await zetroFetch(
      projectUrl(projectId, 'stage'),
      request('POST', { path, staged, ...(hunk === undefined ? {} : { hunk }) }),
    ),
    gitStatusSchema,
  )
}
export async function getFileHistory(projectId: string, path: string) {
  return read(
    await zetroFetch(`${projectUrl(projectId, 'history')}?${new URLSearchParams({ path })}`),
    historySchema,
  ).then((value) => value.history)
}
export async function getFileBlame(projectId: string, path: string) {
  return read(
    await zetroFetch(`${projectUrl(projectId, 'blame')}?${new URLSearchParams({ path })}`),
    blameSchema,
  ).then((value) => value.lines)
}
export async function getConflicts(projectId: string) {
  return read(await zetroFetch(projectUrl(projectId, 'conflicts')), conflictsSchema).then(
    (value) => value.files,
  )
}
export async function resolveGitConflict(
  projectId: string,
  input: { content?: string; path: string; resolution: 'ours' | 'theirs' | 'manual' },
) {
  return read(
    await zetroFetch(projectUrl(projectId, 'conflicts'), request('POST', input)),
    gitStatusSchema,
  )
}
export async function getBranches(projectId: string) {
  return read(await zetroFetch(projectUrl(projectId, 'branches')), branchesSchema).then(
    (value) => value.branches,
  )
}
export async function deleteBranch(projectId: string, branch: string) {
  return read(
    await zetroFetch(projectUrl(projectId, 'branches'), request('DELETE', { branch })),
    branchesSchema,
  ).then((value) => value.branches)
}
export async function getStashes(projectId: string) {
  return read(await zetroFetch(projectUrl(projectId, 'stashes')), stashesSchema).then(
    (value) => value.stashes,
  )
}
export async function updateStash(
  projectId: string,
  input: { action: 'create'; message: string } | { action: 'apply' | 'drop'; index: number },
) {
  return read(
    await zetroFetch(projectUrl(projectId, 'stashes'), request('POST', input)),
    stashesSchema,
  ).then((value) => value.stashes)
}
export async function getRepositoryScripts(projectId: string) {
  return read(await zetroFetch(projectUrl(projectId, 'scripts')), scriptsSchema).then(
    (value) => value.scripts,
  )
}
export async function runRepositoryScriptTask(projectId: string, script: string) {
  return read(
    await zetroFetch(projectUrl(projectId, 'script-tasks'), request('POST', { script })),
    { parse: (value) => value },
  )
}
export async function createGitPullRequest(
  projectId: string,
  input: { base: string; body: string; draft: boolean; title: string },
) {
  return read(
    await zetroFetch(projectUrl(projectId, 'pull-requests'), request('POST', input)),
    pullRequestResponseSchema,
  )
}

function projectUrl(projectId: string, resource: string) {
  return `${apiBaseUrl}/api/v1/projects/${projectId}/developer-tools/${resource}`
}
function request(method: 'DELETE' | 'PATCH' | 'POST', body: unknown): RequestInit {
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
