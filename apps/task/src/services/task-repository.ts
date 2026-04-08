import type { Kysely } from "kysely"

import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import { taskTableNames } from "../../database/table-names.js"
import { asQueryDatabase } from "../data/query-database.js"

export async function listTaskHeaders(database: Kysely<unknown>, filters?: { boardId?: string; assigneeId?: string; entityType?: string; entityId?: string }) {
  let query = asQueryDatabase(database).selectFrom(taskTableNames.taskHeaders).selectAll()

  if (filters?.boardId) {
    query = query.where("board_id", "=", filters.boardId)
  }
  if (filters?.assigneeId) {
    query = query.where("assignee_user_id", "=", filters.assigneeId)
  }
  if (filters?.entityType) {
    query = query.where("entity_type", "=", filters.entityType)
  }
  if (filters?.entityId) {
    query = query.where("entity_id", "=", filters.entityId)
  }

  // Order by board position for native drag-and-drop fractional indexing
  return query.orderBy("board_position", "asc").execute()
}

export async function listTaskBoards(database: Kysely<unknown>) {
  return listJsonStorePayloads(database, taskTableNames.boards)
}

export async function listTaskBoardStages(database: Kysely<unknown>) {
  return listJsonStorePayloads(database, taskTableNames.boardStages)
}

export async function getTaskPayload(database: Kysely<unknown>, taskId: string) {
  const payloads = await listJsonStorePayloads<{ id: string }>(database, taskTableNames.tasks)
  return payloads.find((p) => p.id === taskId) ?? null
}

export async function updateTaskKanbanPosition(
  database: Kysely<unknown>,
  taskId: string,
  newStageId: string,
  newPosition: number
) {
  const queryDatabase = asQueryDatabase(database)

  await queryDatabase
    .updateTable(taskTableNames.taskHeaders)
    .set({
      board_stage_id: newStageId,
      board_position: newPosition,
      updated_at: new Date().toISOString(),
    })
    .where("task_id", "=", taskId)
    .execute()
}

export async function listTaskTemplates(database: Kysely<unknown>) {
  return listJsonStorePayloads<{ id: string; title: string; checklist: string[]; priority: string }>(
    database,
    taskTableNames.templates
  )
}

export async function instantiateTaskTemplate(
  database: Kysely<unknown>,
  templateId: string,
  userId: string,
  entityContext?: { entityType: string; entityId: string }
) {
  const queryDatabase = asQueryDatabase(database)
  
  const templates = await listTaskTemplates(database)
  const template = templates.find((t) => t.id === templateId)
  
  if (!template) throw new Error("Template not found")

  const newTaskId = `task-${Date.now()}`
  const now = new Date().toISOString()
  
  // Store rich payload
  await queryDatabase.insertInto(taskTableNames.tasks).values({
    id: newTaskId,
    module_key: "operations",
    sort_order: 0,
    payload: JSON.stringify({
      id: newTaskId,
      title: template.title,
      description: "",
      checklist: template.checklist.map(text => ({ text, isDone: false })),
      priority: template.priority,
      createdAt: now
    }),
    created_at: now,
    updated_at: now
  } as any).execute()

  // Build relational index header
  await queryDatabase.insertInto(taskTableNames.taskHeaders).values({
    task_id: newTaskId,
    title: template.title,
    board_id: "default-master-queue",
    board_stage_id: "stage-todo",
    board_position: 0,
    status_key: "todo",
    priority: template.priority,
    visibility: "team",
    creator_user_id: userId,
    entity_type: entityContext?.entityType ?? null,
    entity_id: entityContext?.entityId ?? null,
    created_at: now,
    updated_at: now
  } as any).execute()

  return newTaskId
}
