import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"
import {
  listTaskBoards,
  listTaskBoardStages,
  listTaskHeaders,
  listTaskTemplates,
  instantiateTaskTemplate,
  updateTaskKanbanPosition,
} from "../../../task/src/services/task-repository.js"

export function createTaskInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/task/boards", {
      summary: "List all task boards",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        return jsonResponse({ items: await listTaskBoards(context.databases.primary) })
      },
    }),
    defineInternalRoute("/task/stages", {
      summary: "List all task board stages for columns",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        return jsonResponse({ items: await listTaskBoardStages(context.databases.primary) })
      },
    }),
    defineInternalRoute("/task/headers", {
      summary: "Query task headers for Kanban boards and lists",
      handler: async (context) => {
        await requireAuthenticatedUser(context)

        const url = new URL(context.request.url)
        const boardId = url.searchParams.get("boardId") ?? undefined
        const assigneeId = url.searchParams.get("assigneeId") ?? undefined
        const entityType = url.searchParams.get("entityType") ?? undefined
        const entityId = url.searchParams.get("entityId") ?? undefined

        return jsonResponse({
          items: await listTaskHeaders(context.databases.primary, {
            boardId,
            assigneeId,
            entityType,
            entityId,
          }),
        })
      },
    }),
    defineInternalRoute("/task/headers/move", {
      method: "PATCH",
      summary: "Dynamically update task stage and fractional position upon DND drop.",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        
        const payload = context.request.jsonBody as {
          taskId: string
          boardStageId: string
          boardPosition: number
        }

        if (!payload.taskId || payload.boardPosition === undefined) {
          return jsonResponse({ error: "Missing required drag/drop coordinates" }, 400)
        }

        await updateTaskKanbanPosition(
          context.databases.primary,
          payload.taskId,
          payload.boardStageId,
          payload.boardPosition
        )

        return jsonResponse({ success: true })
      },
    }),
    defineInternalRoute("/task/templates", {
      summary: "List all active execution templates",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        return jsonResponse({ items: await listTaskTemplates(context.databases.primary) })
      },
    }),
    defineInternalRoute("/task/instantiate", {
      method: "POST",
      summary: "Instantiate a new task directly from a predefined dynamic template.",
      handler: async (context) => {
        const session = await requireAuthenticatedUser(context)
        const payload = context.request.jsonBody as { 
          templateId: string; 
          entityType?: string; 
          entityId?: string 
        }

        if (!payload.templateId) {
          return jsonResponse({ error: "Missing templateId" }, 400)
        }

        const entityContext = payload.entityType && payload.entityId 
          ? { entityType: payload.entityType, entityId: payload.entityId } 
          : undefined

        const taskId = await instantiateTaskTemplate(
          context.databases.primary,
          payload.templateId,
          session.user.id,
          entityContext
        )

        return jsonResponse({ success: true, taskId })
      },
    }),
  ]
}
