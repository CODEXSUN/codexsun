import { zetroFetch } from '../../lib/zetro-api'
import { taskListSchema, taskResponseSchema } from './system-tasks.schema'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function listSystemTasks(projectId: string | null) {
  const query = projectId ? `?${new URLSearchParams({ projectId })}` : ''
  return read(await zetroFetch(`${apiBaseUrl}/api/v1/system-tasks${query}`), taskListSchema).then(
    ({ tasks }) => tasks,
  )
}

export async function getSystemTask(taskId: string) {
  return read(
    await zetroFetch(`${apiBaseUrl}/api/v1/system-tasks/${taskId}`),
    taskResponseSchema,
  ).then(({ task }) => ({ ...task, steps: task.steps ?? [] }))
}

export async function stopSystemTask(taskId: string) {
  return update(taskId, 'stop')
}

export async function retrySystemTask(taskId: string) {
  return update(taskId, 'retry')
}

async function update(taskId: string, action: 'retry' | 'stop') {
  return read(
    await zetroFetch(`${apiBaseUrl}/api/v1/system-tasks/${taskId}/${action}`, { method: 'POST' }),
    taskResponseSchema,
  ).then(({ task }) => task)
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
    : 'Zetro could not update the system task.'
}
