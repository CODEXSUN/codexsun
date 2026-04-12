import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappeTodoLiveSyncPayloadSchema,
  frappeTodoLiveSyncResponseSchema,
  frappeTodoListResponseSchema,
  frappeTodoResponseSchema,
  frappeTodoSchema,
  frappeTodoUpsertPayloadSchema,
  type FrappeTodo,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import { readFrappeEnvConfig, type FrappeEnvConfig } from "../config/frappe.js"
import { assertFrappeViewer, assertSuperAdmin } from "./access.js"
import {
  createFrappeConnection,
  readFrappeErrorText,
} from "./connection.js"
import { recordFrappeConnectorEvent } from "./observability-service.js"
import { readStoredFrappeSettings } from "./settings-service.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

type FrappeTodoServiceOptions = {
  config?: FrappeEnvConfig
  cwd?: string
}

async function readTodos(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    frappeTableNames.todos,
    frappeTodoSchema
  )

  return items.sort((left, right) =>
    right.modifiedAt.localeCompare(left.modifiedAt)
  )
}

function writeTodos(database: Kysely<unknown>, items: FrappeTodo[]) {
  return replaceStorePayloads(database, frappeTableNames.todos, items.map((item, index) => ({
    id: item.id,
    moduleKey: "todos",
    sortOrder: index + 1,
    payload: item,
    updatedAt: item.modifiedAt,
  })))
}

function remoteNameFromLocalId(id: string) {
  return id.startsWith("frappe-todo:") ? id.slice("frappe-todo:".length) : id
}

function normalizeTodoKeyPart(value: string) {
  return value.trim().toLowerCase()
}

function todoLogicalKey(todo: FrappeTodo) {
  return [
    todo.description,
    todo.dueDate,
    todo.allocatedTo,
  ].map(normalizeTodoKeyPart).join("|")
}

function toLocalTodo(remoteTodo: Record<string, unknown>) {
  const name = typeof remoteTodo.name === "string" ? remoteTodo.name.trim() : ""

  if (!name) {
    throw new ApplicationError("ERPNext ToDo response is missing the document name.", {}, 502)
  }

  return frappeTodoSchema.parse({
    id: `frappe-todo:${name}`,
    description:
      typeof remoteTodo.description === "string" ? remoteTodo.description : "",
    status: typeof remoteTodo.status === "string" ? remoteTodo.status : "",
    priority: typeof remoteTodo.priority === "string" ? remoteTodo.priority : "",
    dueDate: typeof remoteTodo.date === "string" ? remoteTodo.date : "",
    allocatedTo:
      typeof remoteTodo.allocated_to === "string" ? remoteTodo.allocated_to : "",
    owner: typeof remoteTodo.owner === "string" ? remoteTodo.owner : "",
    modifiedAt:
      typeof remoteTodo.modified === "string"
        ? remoteTodo.modified
        : new Date().toISOString(),
  })
}

function toRemoteTodoPayload(todo: FrappeTodo) {
  return {
    description: todo.description,
    status: todo.status,
    priority: todo.priority,
    date: todo.dueDate || null,
    allocated_to: todo.allocatedTo || null,
  }
}

function findMatchingRemoteTodo(todo: FrappeTodo, remoteTodos: FrappeTodo[]) {
  const remoteName = remoteNameFromLocalId(todo.id)
  const localLogicalKey = todoLogicalKey(todo)

  return remoteTodos.find(
    (item) =>
      remoteNameFromLocalId(item.id) === remoteName ||
      todoLogicalKey(item) === localLogicalKey
  )
}

function todoPayloadMatchesRemote(todo: FrappeTodo, remoteTodo: FrappeTodo) {
  return (
    todo.description === remoteTodo.description &&
    todo.status === remoteTodo.status &&
    todo.priority === remoteTodo.priority &&
    todo.dueDate === remoteTodo.dueDate &&
    todo.allocatedTo === remoteTodo.allocatedTo
  )
}

async function readRemoteTodos(connection: ReturnType<typeof createFrappeConnection>) {
  const fields = encodeURIComponent(
    JSON.stringify([
      "name",
      "description",
      "status",
      "priority",
      "date",
      "allocated_to",
      "owner",
      "modified",
    ])
  )
  const { response } = await connection.request({
    path: `/api/resource/ToDo?fields=${fields}&limit_page_length=100`,
  })

  if (!response.ok) {
    throw new ApplicationError(
      "ERPNext rejected the ToDo pull request.",
      { detail: await readFrappeErrorText(response) },
      response.status
    )
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: unknown }
    | null

  if (!Array.isArray(payload?.data)) {
    throw new ApplicationError("ERPNext ToDo pull returned an invalid payload.", {}, 502)
  }

  return payload.data.map((item) =>
    toLocalTodo(item && typeof item === "object" ? item as Record<string, unknown> : {})
  )
}

async function pushRemoteTodo(
  connection: ReturnType<typeof createFrappeConnection>,
  todo: FrappeTodo,
  remoteTodos: FrappeTodo[]
) {
  const remoteName = remoteNameFromLocalId(todo.id)
  const existingRemote = findMatchingRemoteTodo(todo, remoteTodos)

  if (existingRemote && todoPayloadMatchesRemote(todo, existingRemote)) {
    return {
      item: existingRemote,
      didPush: false,
    }
  }

  const existingRemoteName = existingRemote
    ? remoteNameFromLocalId(existingRemote.id)
    : ""
  const path = existingRemote
    ? `/api/resource/ToDo/${encodeURIComponent(existingRemoteName)}`
    : "/api/resource/ToDo"
  const { response } = await connection.request({
    path,
    method: existingRemote ? "PUT" : "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(toRemoteTodoPayload(todo)),
  })

  if (!response.ok) {
    throw new ApplicationError(
      "ERPNext rejected the ToDo push request.",
      {
        todoId: todo.id,
        detail: await readFrappeErrorText(response),
      },
      response.status
    )
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: Record<string, unknown> }
    | null

  return {
    item: toLocalTodo({
      ...toRemoteTodoPayload(todo),
      owner: todo.owner,
      modified: new Date().toISOString(),
      ...(payload?.data ?? {}),
      name:
        typeof payload?.data?.name === "string"
          ? payload.data.name
          : existingRemoteName || remoteName,
    }),
    didPush: true,
  }
}

export async function listFrappeTodos(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertFrappeViewer(user)

  return frappeTodoListResponseSchema.parse({
    todos: {
      items: await readTodos(database),
      syncedAt: new Date().toISOString(),
    },
  })
}

export async function createFrappeTodo(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsedPayload = frappeTodoUpsertPayloadSchema.parse(payload)
  const timestamp = new Date().toISOString()
  const items = await readTodos(database)
  const createdItem = frappeTodoSchema.parse({
    id: `frappe-todo:${randomUUID()}`,
    description: parsedPayload.description,
    status: parsedPayload.status,
    priority: parsedPayload.priority,
    dueDate: parsedPayload.dueDate,
    allocatedTo: parsedPayload.allocatedTo,
    owner: user.email,
    modifiedAt: timestamp,
  })

  await replaceStorePayloads(database, frappeTableNames.todos, [
    createdItem,
    ...items,
  ].map((item, index) => ({
    id: item.id,
    moduleKey: "todos",
    sortOrder: index + 1,
    payload: item,
    updatedAt: item.modifiedAt,
  })))

  return frappeTodoResponseSchema.parse({
    item: createdItem,
  })
}

export async function updateFrappeTodo(
  database: Kysely<unknown>,
  user: AuthUser,
  todoId: string,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsedPayload = frappeTodoUpsertPayloadSchema.parse(payload)
  const items = await readTodos(database)
  const existingItem = items.find((item) => item.id === todoId)

  if (!existingItem) {
    throw new ApplicationError("Frappe ToDo could not be found.", { todoId }, 404)
  }

  const updatedItem = frappeTodoSchema.parse({
    ...existingItem,
    ...parsedPayload,
    modifiedAt: new Date().toISOString(),
  })
  const nextItems = items.map((item) =>
    item.id === todoId ? updatedItem : item
  )

  await replaceStorePayloads(database, frappeTableNames.todos, nextItems.map((item, index) => ({
    id: item.id,
    moduleKey: "todos",
    sortOrder: index + 1,
    payload: item,
    updatedAt: item.modifiedAt,
  })))

  return frappeTodoResponseSchema.parse({
    item: updatedItem,
  })
}

export async function syncFrappeTodosLive(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown,
  options?: FrappeTodoServiceOptions
) {
  assertSuperAdmin(user)

  const parsedPayload = frappeTodoLiveSyncPayloadSchema.parse(payload ?? {})
  const config = options?.config ?? readFrappeEnvConfig(options?.cwd)
  const settings = await readStoredFrappeSettings(database, {
    ...options,
    config,
  })

  if (!settings.enabled || !settings.isConfigured) {
    throw new ApplicationError("ERPNext connector must be enabled and configured before ToDo live sync.", {}, 409)
  }

  if (settings.lastVerificationStatus !== "passed") {
    throw new ApplicationError("ERPNext connector must be verified successfully before ToDo live sync.", {}, 409)
  }

  const connection = createFrappeConnection(config)
  const syncedAt = new Date().toISOString()
  const localTodos = await readTodos(database)
  const remoteTodos = await readRemoteTodos(connection)
  const errors: string[] = []
  let pushedCount = 0
  let pulledCount = 0
  let nextTodos = localTodos

  if (parsedPayload.direction === "pull" || parsedPayload.direction === "bidirectional") {
    const localKeys = new Set([
      ...localTodos.map((item) => item.id),
      ...localTodos.map(todoLogicalKey),
    ])
    pulledCount = remoteTodos.filter(
      (item) => !localKeys.has(item.id) && !localKeys.has(todoLogicalKey(item))
    ).length
    nextTodos = remoteTodos
  }

  if (parsedPayload.direction === "push" || parsedPayload.direction === "bidirectional") {
    const pushedTodos: FrappeTodo[] = []
    const knownRemoteTodos = [...remoteTodos]

    for (const todo of localTodos) {
      try {
        const pushedTodo = await pushRemoteTodo(connection, todo, knownRemoteTodos)
        pushedTodos.push(pushedTodo.item)
        knownRemoteTodos.push(pushedTodo.item)

        if (pushedTodo.didPush) {
          pushedCount += 1
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Unknown ToDo push error.")
      }
    }

    nextTodos = await readRemoteTodos(connection)
  }

  const frappeRecordCount = nextTodos.length
  const appRecordCount = nextTodos.length
  const recordCountDifference = appRecordCount - frappeRecordCount

  await writeTodos(database, nextTodos)
  await recordFrappeConnectorEvent(database, user, {
    action: "todos.live_sync",
    status: errors.length > 0 ? "failure" : "success",
    message:
      errors.length > 0
        ? `Frappe ToDo live sync completed with ${errors.length} failure${errors.length === 1 ? "" : "s"}.`
        : "Frappe ToDo live sync completed.",
    referenceId: "frappe-todos:live-sync",
    details: {
      direction: parsedPayload.direction,
      pushedCount,
      pulledCount,
      failedCount: errors.length,
    },
  })

  return frappeTodoLiveSyncResponseSchema.parse({
    sync: {
      direction: parsedPayload.direction,
      pushedCount,
      pulledCount,
      frappeRecordCount,
      appRecordCount,
      recordCountDifference,
      updatedLocalCount: nextTodos.length,
      failedCount: errors.length,
      syncedAt,
      items: nextTodos,
      errors,
    },
  })
}
