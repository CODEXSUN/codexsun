import { projectListResponseSchema, projectResponseSchema } from './projects.schema'
import type { ProjectUpdate } from './projects.types'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function listProjects() {
  return readResponse(await fetch(`${apiBaseUrl}/api/v1/projects`), projectListResponseSchema).then(
    ({ projects }) => projects,
  )
}

export async function createProject(input: { name: string; repositoryPath: string }) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects`, {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return readResponse(response, projectResponseSchema).then(({ project }) => project)
}

export async function updateProject(projectId: string, input: ProjectUpdate) {
  const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}`, {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  })
  return readResponse(response, projectResponseSchema).then(({ project }) => project)
}

async function readResponse<T>(
  response: Response,
  schema: { parse(value: unknown): T },
): Promise<T> {
  const text = await response.text()
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(
      response.ok ? 'Zetro returned an invalid response.' : 'Zetro API is unavailable.',
    )
  }
  if (!response.ok) throw new Error(readError(payload))
  return schema.parse(payload)
}

function readError(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const error = payload.error
    if (typeof error === 'string') return error
  }
  return 'Zetro could not complete this request.'
}
