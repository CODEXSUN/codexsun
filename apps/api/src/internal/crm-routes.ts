import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"
import {
  listLeadHeaders,
  createLead,
  updateLeadStatus,
  listInteractionHeaders,
  registerInteraction,
  linkTaskToInteraction,
} from "../../../crm/src/services/crm-repository.js"
import { instantiateTaskTemplate } from "../../../task/src/services/task-repository.js"

export function createCrmInternalRoutes(): HttpRouteDefinition[] {
  return [
    // ─── Leads ─────────────────────────────────────────────────────────────
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

    // ─── Interactions ───────────────────────────────────────────────────────
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
      summary: "Register a cold call or interaction and optionally auto-spawn a follow-up task",
      handler: async (context) => {
        const session = await requireAuthenticatedUser(context)
        const body = context.request.jsonBody as {
          lead_id: string
          type: "Cold Call" | "Email" | "Reply" | "Meeting"
          summary: string
          sentiment?: string
          next_steps?: string
          requires_followup?: boolean
          template_id?: string // If provided, auto-instantiate a linked task
        }

        if (!body.lead_id || !body.type || !body.summary) {
          return jsonResponse({ error: "lead_id, type, and summary are required" }, 400)
        }

        const db = context.databases.primary

        // 1. Save the interaction
        const interactionId = await registerInteraction(db, {
          lead_id: body.lead_id,
          type: body.type,
          summary: body.summary,
          sentiment: body.sentiment,
          next_steps: body.next_steps,
          requires_followup: body.requires_followup ?? false,
        })

        // 2. If requires follow-up, auto-instantiate a task from given template
        let taskId: string | undefined
        if (body.requires_followup && body.template_id) {
          taskId = await instantiateTaskTemplate(
            db,
            body.template_id,
            session.user.id,
            {
              entityType: "crm_lead",
              entityId: body.lead_id,
            }
          )

          // 3. Link the new task back to this interaction record
          await linkTaskToInteraction(db, interactionId, taskId)
        }

        return jsonResponse({ success: true, interactionId, taskId })
      },
    }),
  ]
}
