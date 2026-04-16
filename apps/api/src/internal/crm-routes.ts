import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { getCrmCustomer360Board } from "../../../crm/src/services/crm-customer-360-service.js"
import { getCrmScoreboard } from "../../../crm/src/services/crm-scoreboard-service.js"
import {
  assignCrmTask,
  createCrmFollowUpTask,
  getCrmOverviewMetrics,
  listCrmAuditEvents,
  listCrmFollowUpTasks,
  listCrmReminders,
  listCrmTaskAssignments,
  updateCrmReminder,
  updateCrmTaskStatus,
} from "../../../crm/src/services/crm-follow-up-service.js"
import {
  createLead,
  linkTaskToInteraction,
  listInteractionHeaders,
  listLeadHeaders,
  registerInteraction,
  updateLeadStatus,
} from "../../../crm/src/services/crm-repository.js"
import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createCrmInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/crm/overview", {
      summary: "Read CRM overview metrics for leads, tasks, and reminders",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        return jsonResponse({
          item: await getCrmOverviewMetrics(context.databases.primary),
        })
      },
    }),

    defineInternalRoute("/crm/customer-360", {
      summary: "Read a lead-centric CRM customer 360 board",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        const url = new URL(context.request.url)

        return jsonResponse({
          item: await getCrmCustomer360Board(context.databases.primary, {
            leadId: url.searchParams.get("leadId") ?? undefined,
          }),
        })
      },
    }),

    defineInternalRoute("/crm/scoreboard", {
      summary: "Read deterministic CRM scoring and owner leaderboard metrics",
      handler: async (context) => {
        await requireAuthenticatedUser(context)

        return jsonResponse({
          item: await getCrmScoreboard(context.databases.primary),
        })
      },
    }),

    defineInternalRoute("/crm/leads", {
      summary: "List lead headers filtered by status or owner",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        const url = new URL(context.request.url)
        const status = url.searchParams.get("status") ?? undefined
        const ownerId = url.searchParams.get("ownerId") ?? undefined

        return jsonResponse({
          items: await listLeadHeaders(context.databases.primary, { status, ownerId }),
        })
      },
    }),

    defineInternalRoute("/crm/leads", {
      method: "POST",
      summary: "Register a new CRM lead record",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        const body = context.request.jsonBody as {
          company_name: string
          contact_name: string
          email?: string
          phone?: string
          source?: string
          notes?: string
        }

        if (!body.company_name || !body.contact_name) {
          return jsonResponse({ error: "company_name and contact_name are required" }, 400)
        }

        const leadId = await createLead(context.databases.primary, body)
        return jsonResponse({ success: true, leadId })
      },
    }),

    defineInternalRoute("/crm/leads/status", {
      method: "PATCH",
      summary: "Update a lead's pipeline status",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        const body = context.request.jsonBody as { leadId: string; status: string }

        if (!body.leadId || !body.status) {
          return jsonResponse({ error: "leadId and status are required" }, 400)
        }

        await updateLeadStatus(context.databases.primary, body.leadId, body.status)
        return jsonResponse({ success: true })
      },
    }),

    defineInternalRoute("/crm/interactions", {
      summary: "List interactions, optionally filtered by leadId",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        const url = new URL(context.request.url)
        const leadId = url.searchParams.get("leadId") ?? undefined

        return jsonResponse({
          items: await listInteractionHeaders(context.databases.primary, leadId),
        })
      },
    }),

    defineInternalRoute("/crm/interactions", {
      method: "POST",
      summary: "Register a CRM interaction and optionally create a CRM follow-up task",
      handler: async (context) => {
        const session = await requireAuthenticatedUser(context)
        const body = context.request.jsonBody as {
          lead_id: string
          type: "Cold Call" | "Email" | "Reply" | "Meeting"
          summary: string
          sentiment?: string
          next_steps?: string
          requires_followup?: boolean
          follow_up_title?: string
          follow_up_description?: string
          assignee_user_id?: string
          assignee_name?: string
          due_at?: string
          reminder_at?: string
          priority?: "low" | "medium" | "high" | "urgent"
        }

        if (!body.lead_id || !body.type || !body.summary) {
          return jsonResponse({ error: "lead_id, type, and summary are required" }, 400)
        }

        const db = context.databases.primary
        const interactionId = await registerInteraction(db, {
          lead_id: body.lead_id,
          type: body.type,
          summary: body.summary,
          sentiment: body.sentiment,
          next_steps: body.next_steps,
          requires_followup: body.requires_followup ?? false,
        })

        let taskId: string | undefined
        let reminderId: string | null | undefined

        if (body.requires_followup) {
          const taskResult = await createCrmFollowUpTask(db, {
            leadId: body.lead_id,
            interactionId,
            title: body.follow_up_title?.trim() || body.next_steps?.trim() || "Follow up with customer",
            description: body.follow_up_description?.trim() || body.summary,
            assigneeUserId: body.assignee_user_id?.trim() || session.user.id,
            assigneeName: body.assignee_name?.trim() || session.user.displayName,
            dueAt: body.due_at?.trim() || null,
            reminderAt: body.reminder_at?.trim() || null,
            priority: body.priority ?? "medium",
            createdByUserId: session.user.id,
            actor: {
              userId: session.user.id,
              displayName: session.user.displayName,
            },
          })

          taskId = taskResult.crmTaskId
          reminderId = taskResult.reminderId
          await linkTaskToInteraction(db, interactionId, taskId)
        }

        return jsonResponse({ success: true, interactionId, taskId, reminderId })
      },
    }),

    defineInternalRoute("/crm/follow-up-tasks", {
      summary: "List CRM follow-up tasks filtered by lead, assignee, or status",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        const url = new URL(context.request.url)

        return jsonResponse({
          items: await listCrmFollowUpTasks(context.databases.primary, {
            leadId: url.searchParams.get("leadId") ?? undefined,
            assigneeUserId: url.searchParams.get("assigneeUserId") ?? undefined,
            status: url.searchParams.get("status") ?? undefined,
          }),
        })
      },
    }),

    defineInternalRoute("/crm/follow-up-task/assignments", {
      summary: "List CRM task assignment history filtered by lead or CRM task",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        const url = new URL(context.request.url)

        return jsonResponse({
          items: await listCrmTaskAssignments(context.databases.primary, {
            leadId: url.searchParams.get("leadId") ?? undefined,
            crmTaskId: url.searchParams.get("crmTaskId") ?? undefined,
          }),
        })
      },
    }),

    defineInternalRoute("/crm/follow-up-task/assignment", {
      method: "PATCH",
      summary: "Assign or reassign a CRM follow-up task with assignment history tracking",
      handler: async (context) => {
        const session = await requireAuthenticatedUser(context)
        const body = context.request.jsonBody as {
          crmTaskId: string
          assigneeUserId?: string
          assigneeName?: string
          reason?: string
        }

        if (!body.crmTaskId) {
          return jsonResponse({ error: "crmTaskId is required" }, 400)
        }

        const result = await assignCrmTask(context.databases.primary, {
          crmTaskId: body.crmTaskId,
          assigneeUserId: body.assigneeUserId?.trim() || null,
          assigneeName: body.assigneeName?.trim() || null,
          reason: body.reason?.trim() || null,
          actor: {
            userId: session.user.id,
            displayName: session.user.displayName,
          },
        })

        return jsonResponse({ success: true, item: result })
      },
    }),

    defineInternalRoute("/crm/follow-up-task/status", {
      method: "PATCH",
      summary: "Update CRM follow-up task status to in progress, completed, or revoked",
      handler: async (context) => {
        const session = await requireAuthenticatedUser(context)
        const body = context.request.jsonBody as {
          crmTaskId: string
          status: "open" | "in_progress" | "completed" | "revoked"
          note?: string
        }

        if (!body.crmTaskId || !body.status) {
          return jsonResponse({ error: "crmTaskId and status are required" }, 400)
        }

        await updateCrmTaskStatus(context.databases.primary, {
          crmTaskId: body.crmTaskId,
          status: body.status,
          note: body.note,
          actor: {
            userId: session.user.id,
            displayName: session.user.displayName,
          },
        })

        return jsonResponse({ success: true })
      },
    }),

    defineInternalRoute("/crm/reminders", {
      summary: "List CRM reminders filtered by lead, task, or status",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        const url = new URL(context.request.url)

        return jsonResponse({
          items: await listCrmReminders(context.databases.primary, {
            leadId: url.searchParams.get("leadId") ?? undefined,
            crmTaskId: url.searchParams.get("crmTaskId") ?? undefined,
            status: url.searchParams.get("status") ?? undefined,
          }),
        })
      },
    }),

    defineInternalRoute("/crm/reminder", {
      method: "PATCH",
      summary: "Snooze, complete, or revoke a CRM reminder",
      handler: async (context) => {
        const session = await requireAuthenticatedUser(context)
        const body = context.request.jsonBody as {
          reminderId: string
          status: "pending" | "snoozed" | "completed" | "revoked"
          snoozedUntil?: string
          note?: string
        }

        if (!body.reminderId || !body.status) {
          return jsonResponse({ error: "reminderId and status are required" }, 400)
        }

        await updateCrmReminder(context.databases.primary, {
          reminderId: body.reminderId,
          status: body.status,
          snoozedUntil: body.snoozedUntil,
          note: body.note,
          actor: {
            userId: session.user.id,
            displayName: session.user.displayName,
          },
        })

        return jsonResponse({ success: true })
      },
    }),

    defineInternalRoute("/crm/audit", {
      summary: "List CRM audit events filtered by lead, interaction, or CRM task",
      handler: async (context) => {
        await requireAuthenticatedUser(context)
        const url = new URL(context.request.url)

        return jsonResponse({
          items: await listCrmAuditEvents(context.databases.primary, {
            leadId: url.searchParams.get("leadId") ?? undefined,
            crmTaskId: url.searchParams.get("crmTaskId") ?? undefined,
            interactionId: url.searchParams.get("interactionId") ?? undefined,
          }),
        })
      },
    }),
  ]
}
