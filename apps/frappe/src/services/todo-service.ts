import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  frappeTodoListResponseSchema,
  frappeTodoResponseSchema,
  frappeTodoSchema,
  frappeTodoUpsertPayloadSchema,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import { assertFrappeViewer, assertSuperAdmin } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

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
