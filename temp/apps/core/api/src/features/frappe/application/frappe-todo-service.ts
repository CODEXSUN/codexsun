import {
  frappeTodoListResponseSchema,
  frappeTodoResponseSchema,
  frappeTodoSchema,
  frappeTodoUpsertPayloadSchema,
  type AuthUser,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { assertFrappeViewer, assertSuperAdmin, requestFrappeJson } from './frappe-client'

function toTodoItem(record: Record<string, unknown>) {
  return frappeTodoSchema.parse({
    id: typeof record.name === 'string' ? record.name : '',
    description: typeof record.description === 'string' ? record.description : '',
    status: typeof record.status === 'string' ? record.status : 'Open',
    priority: typeof record.priority === 'string' ? record.priority : 'Medium',
    dueDate: typeof record.date === 'string' ? record.date : '',
    allocatedTo: typeof record.allocated_to === 'string' ? record.allocated_to : '',
    owner: typeof record.owner === 'string' ? record.owner : '',
    modifiedAt: typeof record.modified === 'string' ? record.modified : '',
  })
}

async function readTodoById(todoId: string) {
  const payload = await requestFrappeJson(`/api/resource/ToDo/${encodeURIComponent(todoId)}`)
  const item = payload && typeof payload.data === 'object' && payload.data
    ? payload.data as Record<string, unknown>
    : {}

  return toTodoItem(item)
}

function toTodoRequestBody(payload: { description: string; status: string; priority: string; dueDate: string; allocatedTo: string }) {
  return JSON.stringify({
    description: payload.description,
    status: payload.status,
    priority: payload.priority,
    date: payload.dueDate || null,
    allocated_to: payload.allocatedTo || null,
  })
}

export async function listFrappeTodos(user: AuthUser) {
  assertFrappeViewer(user)

  const query = new URLSearchParams({
    fields: JSON.stringify(['name', 'description', 'status', 'priority', 'date', 'allocated_to', 'owner', 'modified']),
    order_by: 'modified desc',
    limit_page_length: '100',
  })

  const payload = await requestFrappeJson(`/api/resource/ToDo?${query.toString()}`)
  const items = Array.isArray(payload?.data)
    ? payload.data.map((entry) => toTodoItem(entry as Record<string, unknown>))
    : []

  return frappeTodoListResponseSchema.parse({
    todos: {
      items,
      syncedAt: new Date().toISOString(),
    },
  })
}

export async function createFrappeTodo(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = frappeTodoUpsertPayloadSchema.parse(payload)
  const createdPayload = await requestFrappeJson('/api/resource/ToDo', {
    method: 'POST',
    body: toTodoRequestBody(parsedPayload),
  })
  const createdRecord = createdPayload && typeof createdPayload.data === 'object' && createdPayload.data
    ? createdPayload.data as Record<string, unknown>
    : null
  const todoId = createdRecord && typeof createdRecord.name === 'string'
    ? createdRecord.name
    : ''

  if (!todoId) {
    throw new ApplicationError('Frappe ToDo create response did not include a document id.', {}, 502)
  }

  return frappeTodoResponseSchema.parse({
    item: await readTodoById(todoId),
  })
}

export async function updateFrappeTodo(user: AuthUser, todoId: string, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = frappeTodoUpsertPayloadSchema.parse(payload)
  await requestFrappeJson(`/api/resource/ToDo/${encodeURIComponent(todoId)}`, {
    method: 'PUT',
    body: toTodoRequestBody(parsedPayload),
  })

  return frappeTodoResponseSchema.parse({
    item: await readTodoById(todoId),
  })
}
