import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappeTodoLiveSyncPayloadSchema,
  frappeTodoLiveSyncResponseSchema,
  frappeTodoVerifySyncResponseSchema,
  frappeTodoBulkDeletePayloadSchema,
  frappeTodoBulkDeleteResponseSchema,
  frappeTodoListResponseSchema,
  frappeTodoResponseSchema,
  frappeTodoSchema,
  frappeTodoUserOptionSchema,
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

type FrappeTodoUserOption = {
  id: string
  email: string
  fullName: string
  label: string
  disabled: boolean
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
    status: typeof remoteTodo.status === "string" ? remoteTodo.status : "",
    priority: typeof remoteTodo.priority === "string" ? remoteTodo.priority : "",
    color: typeof remoteTodo.color === "string" ? remoteTodo.color : "",
    dueDate: typeof remoteTodo.date === "string" ? remoteTodo.date : "",
    allocatedTo:
      typeof remoteTodo.allocated_to === "string" ? remoteTodo.allocated_to : "",
    allocatedToFullName: "",
    description:
      typeof remoteTodo.description === "string" ? remoteTodo.description : "",
    referenceType:
      typeof remoteTodo.reference_type === "string" ? remoteTodo.reference_type : "",
    referenceName:
      typeof remoteTodo.reference_name === "string" ? remoteTodo.reference_name : "",
    role: typeof remoteTodo.role === "string" ? remoteTodo.role : "",
    assignedBy:
      typeof remoteTodo.assigned_by === "string" ? remoteTodo.assigned_by : "",
    assignedByFullName:
      typeof remoteTodo.assigned_by_full_name === "string"
        ? remoteTodo.assigned_by_full_name
        : "",
    sender: typeof remoteTodo.sender === "string" ? remoteTodo.sender : "",
    assignmentRule:
      typeof remoteTodo.assignment_rule === "string" ? remoteTodo.assignment_rule : "",
    owner: typeof remoteTodo.owner === "string" ? remoteTodo.owner : "",
    modifiedAt:
      typeof remoteTodo.modified === "string"
        ? remoteTodo.modified
        : new Date().toISOString(),
  })
}

function toRemoteTodoPayload(todo: FrappeTodo) {
  return {
    status: todo.status,
    priority: todo.priority,
    color: todo.color || null,
    date: todo.dueDate || null,
    allocated_to: todo.allocatedTo || null,
    description: todo.description,
    reference_type: todo.referenceType || null,
    reference_name: todo.referenceName || null,
    role: todo.role || null,
    assigned_by: todo.assignedBy || null,
    sender: todo.sender || null,
  }
}

function toRemoteUserOption(remoteUser: Record<string, unknown>) {
  const id = typeof remoteUser.name === "string" ? remoteUser.name.trim() : ""
  const email = typeof remoteUser.email === "string" ? remoteUser.email.trim() : id
  const fullName =
    typeof remoteUser.full_name === "string" ? remoteUser.full_name.trim() : ""
  const enabled =
    typeof remoteUser.enabled === "boolean"
      ? remoteUser.enabled
      : Number(remoteUser.enabled ?? 1) !== 0

  if (!id) {
    return null
  }

  return frappeTodoUserOptionSchema.parse({
    id,
    email,
    fullName,
    label: fullName ? `${fullName} - ${email || id}` : email || id,
    disabled: !enabled,
  })
}

function getUserOptionKeys(user: FrappeTodoUserOption) {
  return [user.id, user.email]
    .filter(Boolean)
    .map((value) => value.toLowerCase())
}

function enrichTodosWithUsers(todos: FrappeTodo[], users: FrappeTodoUserOption[]) {
  const usersByKey = new Map<string, FrappeTodoUserOption>()

  for (const user of users) {
    for (const key of getUserOptionKeys(user)) {
      usersByKey.set(key, user)
    }
  }

  return todos.map((todo) => {
    const allocatedUser = usersByKey.get(todo.allocatedTo.toLowerCase())
    const assignedByUser = usersByKey.get(todo.assignedBy.toLowerCase())

    return frappeTodoSchema.parse({
      ...todo,
      allocatedToFullName: allocatedUser?.fullName ?? todo.allocatedToFullName,
      assignedByFullName:
        todo.assignedByFullName || assignedByUser?.fullName || "",
    })
  })
}

function sortTodosByModifiedAt(todos: FrappeTodo[]) {
  return [...todos].sort((left, right) =>
    right.modifiedAt.localeCompare(left.modifiedAt)
  )
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
    todo.color === remoteTodo.color &&
    todo.dueDate === remoteTodo.dueDate &&
    todo.allocatedTo === remoteTodo.allocatedTo &&
    todo.referenceType === remoteTodo.referenceType &&
    todo.referenceName === remoteTodo.referenceName &&
    todo.role === remoteTodo.role &&
    todo.assignedBy === remoteTodo.assignedBy &&
    todo.sender === remoteTodo.sender
  )
}

async function readRemoteTodos(connection: ReturnType<typeof createFrappeConnection>) {
  const fields = encodeURIComponent(
    JSON.stringify([
      "name",
      "description",
      "status",
      "priority",
      "color",
      "date",
      "allocated_to",
      "reference_type",
      "reference_name",
      "role",
      "assigned_by",
      "assigned_by_full_name",
      "sender",
      "assignment_rule",
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

async function readRemoteUsers(connection: ReturnType<typeof createFrappeConnection>) {
  const fields = encodeURIComponent(
    JSON.stringify(["name", "email", "full_name", "enabled"])
  )
  const { response } = await connection.request({
    path: `/api/resource/User?fields=${fields}&limit_page_length=500`,
  })

  if (!response.ok) {
    throw new ApplicationError(
      "ERPNext rejected the User reference request.",
      { detail: await readFrappeErrorText(response) },
      response.status
    )
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: unknown }
    | null

  if (!Array.isArray(payload?.data)) {
    throw new ApplicationError("ERPNext User reference request returned an invalid payload.", {}, 502)
  }

  return payload.data
    .map((item) =>
      toRemoteUserOption(item && typeof item === "object" ? item as Record<string, unknown> : {})
    )
    .filter((item): item is FrappeTodoUserOption => Boolean(item))
}

async function readTodoUserReferences(
  database: Kysely<unknown>,
  options?: FrappeTodoServiceOptions
) {
  const config = options?.config ?? readFrappeEnvConfig(options?.cwd)
  const settings = await readStoredFrappeSettings(database, {
    ...options,
    config,
  })

  if (!settings.enabled || !settings.isConfigured) {
    return []
  }

  if (settings.lastVerificationStatus !== "passed") {
    return []
  }

  return readRemoteUsers(createFrappeConnection(config))
}

async function createVerifiedTodoConnection(
  database: Kysely<unknown>,
  options?: FrappeTodoServiceOptions
) {
  const config = options?.config ?? readFrappeEnvConfig(options?.cwd)
  const settings = await readStoredFrappeSettings(database, {
    ...options,
    config,
  })

  if (!settings.enabled || !settings.isConfigured) {
    throw new ApplicationError("ERPNext connector must be enabled and configured before ToDo sync checks.", {}, 409)
  }

  if (settings.lastVerificationStatus !== "passed") {
    throw new ApplicationError("ERPNext connector must be verified successfully before ToDo sync checks.", {}, 409)
  }

  return createFrappeConnection(config)
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
  user: AuthUser,
  options?: FrappeTodoServiceOptions
) {
  assertFrappeViewer(user)

  const users = await readTodoUserReferences(database, options)

  return frappeTodoListResponseSchema.parse({
    todos: {
      items: enrichTodosWithUsers(await readTodos(database), users),
      syncedAt: new Date().toISOString(),
      references: {
        users,
      },
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
  const description = parsedPayload.description.trim()
  const createdItem = frappeTodoSchema.parse({
    id: `frappe-todo:${randomUUID()}`,
    description,
    status: parsedPayload.status,
    priority: parsedPayload.priority,
    color: parsedPayload.color,
    dueDate: parsedPayload.dueDate,
    allocatedTo: parsedPayload.allocatedTo,
    allocatedToFullName: "",
    referenceType: "",
    referenceName: "",
    role: "",
    assignedBy: parsedPayload.assignedBy,
    assignedByFullName: "",
    sender: "",
    assignmentRule: "",
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
    description: parsedPayload.description.trim(),
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

export async function deleteFrappeTodos(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const parsedPayload = frappeTodoBulkDeletePayloadSchema.parse(payload)
  const deleteIds = new Set(parsedPayload.todoIds)
  const items = await readTodos(database)
  const nextItems = items.filter((item) => !deleteIds.has(item.id))
  const deletedCount = items.length - nextItems.length

  await writeTodos(database, nextItems)

  return frappeTodoBulkDeleteResponseSchema.parse({
    deletedCount,
    remainingCount: nextItems.length,
    items: nextItems,
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
  const connection = await createVerifiedTodoConnection(database, options)
  const syncedAt = new Date().toISOString()
  const localTodos = await readTodos(database)
  const selectedTodoIds = new Set(parsedPayload.todoIds)
  const pushTodos =
    selectedTodoIds.size > 0
      ? localTodos.filter((item) => selectedTodoIds.has(item.id))
      : localTodos
  const remoteTodos = await readRemoteTodos(connection)
  const users = await readRemoteUsers(connection)
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
    nextTodos = enrichTodosWithUsers(remoteTodos, users)
  }

  if (parsedPayload.direction === "push" || parsedPayload.direction === "bidirectional") {
    const pushedTodos: FrappeTodo[] = []
    const knownRemoteTodos = [...remoteTodos]

    for (const todo of pushTodos) {
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

    if (selectedTodoIds.size > 0 && parsedPayload.direction === "push") {
      nextTodos = sortTodosByModifiedAt([
        ...localTodos.filter((item) => !selectedTodoIds.has(item.id)),
        ...enrichTodosWithUsers(pushedTodos, users),
      ])
    } else {
      nextTodos = enrichTodosWithUsers(await readRemoteTodos(connection), users)
    }
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

export async function verifyFrappeTodosSync(
  database: Kysely<unknown>,
  user: AuthUser,
  options?: FrappeTodoServiceOptions
) {
  assertSuperAdmin(user)

  const connection = await createVerifiedTodoConnection(database, options)
  const verifiedAt = new Date().toISOString()
  const localTodos = await readTodos(database)
  const remoteTodos = await readRemoteTodos(connection)
  const items = localTodos.map((todo) => {
    const matchingRemoteTodo = findMatchingRemoteTodo(todo, remoteTodos)

    if (!matchingRemoteTodo) {
      return {
        todoId: todo.id,
        remoteName: "",
        status: "not_synced" as const,
        message: "No matching ERPNext ToDo was found.",
      }
    }

    const isSynced = todoPayloadMatchesRemote(todo, matchingRemoteTodo)

    return {
      todoId: todo.id,
      remoteName: remoteNameFromLocalId(matchingRemoteTodo.id),
      status: isSynced ? "synced" as const : "changed" as const,
      message: isSynced
        ? "Local snapshot matches ERPNext."
        : "Local snapshot differs from ERPNext.",
    }
  })
  const syncedCount = items.filter((item) => item.status === "synced").length
  const notSyncedCount = items.filter((item) => item.status === "not_synced").length
  const changedCount = items.filter((item) => item.status === "changed").length

  await recordFrappeConnectorEvent(database, user, {
    action: "todos.verify_sync",
    status: notSyncedCount > 0 || changedCount > 0 ? "failure" : "success",
    message:
      notSyncedCount > 0 || changedCount > 0
        ? `Frappe ToDo sync verification found ${notSyncedCount} not synced and ${changedCount} changed record${notSyncedCount + changedCount === 1 ? "" : "s"}.`
        : "Frappe ToDo sync verification passed.",
    referenceId: "frappe-todos:verify-sync",
    details: {
      checkedCount: items.length,
      syncedCount,
      notSyncedCount,
      changedCount,
    },
  })

  return frappeTodoVerifySyncResponseSchema.parse({
    verification: {
      checkedCount: items.length,
      syncedCount,
      notSyncedCount,
      changedCount,
      verifiedAt,
      items,
    },
  })
}
