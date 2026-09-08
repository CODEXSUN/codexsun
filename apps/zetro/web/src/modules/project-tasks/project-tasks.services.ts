import { taskListResponseSchema, taskResponseSchema } from './project-tasks.schema'
import type { TaskPriority, TaskUpdate } from './project-tasks.types'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function listTasks(projectId: string, archived = false) {
  const query = new URLSearchParams({ archived: String(archived), projectId })
  return readResponse(
    await fetch(`${apiBaseUrl}/api/v1/tasks?${query}`),
    taskListResponseSchema,
  ).then(({ tasks }) => tasks)
}

export async function createTask(input: {
  description: string
  priority: TaskPriority
  projectId: string
  title: string
}) {
  const response = await fetch(`${apiBaseUrl}/api/v1/tasks`, {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return readResponse(response, taskResponseSchema).then(({ task }) => task)
}

export async function updateTask(projectId: string, taskId: string, update: TaskUpdate) {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/tasks/${taskId}?${new URLSearchParams({ projectId })}`,
    {
      body: JSON.stringify(update),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    },
  )
  return readResponse(response, taskResponseSchema).then(({ task }) => task)
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
