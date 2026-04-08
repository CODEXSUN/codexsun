import type { Kysely } from "kysely"

import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { crmTableNames } from "../../database/table-names.js"
import { asQueryDatabase } from "../data/query-database.js"

// ─── Lead Types ──────────────────────────────────────────────────────────────

export interface CrmLeadPayload {
  id: string
  company_name: string
  contact_name: string
  email?: string
  phone?: string
  source?: string
  status: "Cold" | "Warm" | "Qualified" | "Converted" | "Lost"
  notes?: string
  created_at: string
}

export interface CrmInteractionPayload {
  id: string
  lead_id: string
  type: "Cold Call" | "Email" | "Reply" | "Meeting"
  summary: string
  sentiment?: "Positive" | "Neutral" | "Negative"
  next_steps?: string
  requires_followup: boolean
  linked_task_id?: string
  interaction_date: string
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function listLeads(database: Kysely<unknown>) {
  return listJsonStorePayloads<CrmLeadPayload>(database, crmTableNames.leads)
}

export async function listLeadHeaders(
  database: Kysely<unknown>,
  filters?: { status?: string; ownerId?: string }
) {
  let query = asQueryDatabase(database)
    .selectFrom(crmTableNames.leadHeaders)
    .selectAll()
    .where("deleted_at", "is", null)

  if (filters?.status) {
    query = query.where("status", "=", filters.status)
  }
  if (filters?.ownerId) {
    query = query.where("owner_id", "=", filters.ownerId)
  }

  return query.orderBy("created_at", "desc").execute()
}

export async function createLead(
  database: Kysely<unknown>,
  data: {
    company_name: string
    contact_name: string
    email?: string
    phone?: string
    source?: string
    notes?: string
    owner_id?: string
  }
) {
  const db = asQueryDatabase(database)
  const leadId = `lead-${Date.now()}`
  const now = new Date().toISOString()

  const payload: CrmLeadPayload = {
    id: leadId,
    company_name: data.company_name,
    contact_name: data.contact_name,
    email: data.email,
    phone: data.phone,
    source: data.source ?? "Manual",
    status: "Cold",
    notes: data.notes,
    created_at: now,
  }

  // JSON store — rich payload
  const existingLeads = await listLeads(database)
  await replaceJsonStoreRecords(
    database,
    crmTableNames.leads,
    [...existingLeads, payload].map((item, index) => ({
      id: item.id,
      moduleKey: "crm",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.created_at,
      updatedAt: item.created_at,
    }))
  )

  // Relational header — indexed for queries
  await db
    .insertInto(crmTableNames.leadHeaders)
    .values({
      lead_id: leadId,
      company_name: data.company_name,
      contact_name: data.contact_name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      source: data.source ?? "Manual",
      status: "Cold",
      owner_id: data.owner_id ?? null,
      created_at: now,
      updated_at: now,
    } as any)
    .execute()

  return leadId
}

export async function updateLeadStatus(
  database: Kysely<unknown>,
  leadId: string,
  status: string
) {
  await asQueryDatabase(database)
    .updateTable(crmTableNames.leadHeaders)
    .set({ status, updated_at: new Date().toISOString() })
    .where("lead_id", "=", leadId)
    .execute()
}

// ─── Interactions ─────────────────────────────────────────────────────────────

export async function listInteractionHeaders(
  database: Kysely<unknown>,
  leadId?: string
) {
  let query = asQueryDatabase(database)
    .selectFrom(crmTableNames.interactionHeaders)
    .selectAll()
    .orderBy("interaction_date", "desc")

  if (leadId) {
    query = query.where("lead_id", "=", leadId)
  }

  return query.execute()
}

export async function registerInteraction(
  database: Kysely<unknown>,
  data: {
    lead_id: string
    type: "Cold Call" | "Email" | "Reply" | "Meeting"
    summary: string
    sentiment?: string
    next_steps?: string
    requires_followup?: boolean
  }
) {
  const db = asQueryDatabase(database)
  const interactionId = `int-${Date.now()}`
  const now = new Date().toISOString()

  const payload: CrmInteractionPayload = {
    id: interactionId,
    lead_id: data.lead_id,
    type: data.type,
    summary: data.summary,
    sentiment: data.sentiment as any,
    next_steps: data.next_steps,
    requires_followup: data.requires_followup ?? false,
    interaction_date: now,
  }

  const existingInteractions = await listJsonStorePayloads<CrmInteractionPayload>(
    database,
    crmTableNames.interactions
  )
  await replaceJsonStoreRecords(
    database,
    crmTableNames.interactions,
    [...existingInteractions, payload].map((item, index) => ({
      id: item.id,
      moduleKey: "crm",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.interaction_date,
      updatedAt: item.interaction_date,
    }))
  )

  await db
    .insertInto(crmTableNames.interactionHeaders)
    .values({
      interaction_id: interactionId,
      lead_id: data.lead_id,
      type: data.type,
      summary: data.summary,
      sentiment: data.sentiment ?? null,
      requires_followup: data.requires_followup ? 1 : 0,
      linked_task_id: null,
      interaction_date: now,
      created_at: now,
    } as any)
    .execute()

  return interactionId
}

export async function linkTaskToInteraction(
  database: Kysely<unknown>,
  interactionId: string,
  taskId: string
) {
  await asQueryDatabase(database)
    .updateTable(crmTableNames.interactionHeaders)
    .set({ linked_task_id: taskId })
    .where("interaction_id", "=", interactionId)
    .execute()
}
