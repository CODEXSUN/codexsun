import { taskListResponseSchema, taskResponseSchema } from './tasks.schema'
import type { CreateTaskInput, TaskStatus, ZetroTask } from './tasks.types'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function listTasks(): Promise<ZetroTask[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/tasks`)
  return readResponse(response, taskListResponseSchema).then(({ tasks }) => tasks)
}

export async function createTask(input: CreateTaskInput): Promise<ZetroTask> {
  const response = await fetch(`${apiBaseUrl}/api/v1/tasks`, {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return readResponse(response, taskResponseSchema).then(({ task }) => task)
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<ZetroTask> {
  const response = await fetch(`${apiBaseUrl}/api/v1/tasks/${taskId}`, {
    body: JSON.stringify({ status }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  })
  return readResponse(response, taskResponseSchema).then(({ task }) => task)
}

async function readResponse<T>(
  response: Response,
  schema: { parse(value: unknown): T },
): Promise<T> {
  const payload = (await response.json()) as unknown

  if (!response.ok) {
    throw new Error(readError(payload))
  }

  return schema.parse(payload)
}

function readError(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const error = payload.error
    if (typeof error === 'string') return error
  }

  return 'Zetro could not update tasks.'
}
