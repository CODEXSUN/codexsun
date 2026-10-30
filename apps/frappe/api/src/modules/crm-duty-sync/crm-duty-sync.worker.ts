import { AppError } from "@codexsun/framework/errors";
import type { CrmFrappeSyncType } from "@codexsun/crm-api";
import type { FrappeSettings } from "../connection/index.js";
import { requestFrappe } from "../connection/index.js";
import { sql, type Kysely } from "kysely";

import type { SyncDatabase, SyncResult } from "./crm-duty-sync.types.js";
import {
  frappeDutyFrequency,
  resolveDutyDepartment,
  dutyReportActions,
  dutyReportDate,
  dutyItemSteps,
  dutyItemName
} from "./crm-duty-sync.mapping.js";
export async function processCrmDutySync(
  database: Kysely<SyncDatabase>,
  eventId: number,
  settings: FrappeSettings,
  employeeCodeForEmail: (email: string, baseUrl: string) => Promise<string | null>
): Promise<SyncResult> {
  const initial = await database
    .selectFrom("crm_frappe_sync_queue")
    .selectAll()
    .where("id", "=", eventId)
    .executeTakeFirst();
  const event = initial;
  if (!event) throw AppError.notFound("CRM Frappe sync queue event was not found.");
  if (event.entity_type === "contact")
    throw AppError.validation("Use the contact export worker for contacts.");
  if (event.status === "synced" && event.remote_name)
    return { eventId, status: "synced", remoteName: event.remote_name };
  const claim = await database
    .updateTable("crm_frappe_sync_queue")
    .set({ status: "processing", attempts: sql`attempts + 1` })
    .where("id", "=", eventId)
    .where("status", "=", "pending")
    .where("dispatch_revision", "=", event.dispatch_revision)
    .where("attempts", "<", 5)
    .executeTakeFirst();
  if (Number(claim.numUpdatedRows) !== 1) {
    const current = await database
      .selectFrom("crm_frappe_sync_queue")
      .select(["status", "remote_name"])
      .where("id", "=", eventId)
      .executeTakeFirst();
    if (current?.status === "synced" && current.remote_name)
      return { eventId, status: "synced", remoteName: current.remote_name };
    return { eventId, status: "skipped" };
  }
  const claimed = { ...event, attempts: event.attempts + 1 };
  try {
    const { path, payload, remoteName } = await buildDocument(
      database,
      claimed.entity_type,
      claimed.local_record_id,
      claimed.remote_name,
      employeeCodeForEmail,
      settings
    );
    const response = remoteName
      ? await requestFrappe<{ data?: { name?: string } }>(
          `${path}/${encodeURIComponent(remoteName)}`,
          "PUT",
          settings,
          payload,
          { allowExport: true }
        )
      : await requestFrappe<{ data?: { name?: string } }>(path, "POST", settings, payload, {
          allowExport: true
        });
    const resolvedName = response.data?.name ?? remoteName;
    if (!resolvedName)
      throw AppError.conflict("Frappe accepted the record without returning its name.");
    await database
      .updateTable("crm_frappe_sync_queue")
      .set({
        status: sql`CASE WHEN dispatch_revision<>${claimed.dispatch_revision} THEN 'pending' ELSE 'synced' END`,
        attempts: sql`CASE WHEN dispatch_revision<>${claimed.dispatch_revision} THEN 0 ELSE attempts END`,
        remote_name: resolvedName,
        last_error: null
      })
      .where("id", "=", eventId)
      .where("status", "=", "processing")
      .execute();
    return { eventId, status: "synced", remoteName: resolvedName };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Frappe sync failed.";
    await database
      .updateTable("crm_frappe_sync_queue")
      .set({
        status: sql`CASE WHEN dispatch_revision<>${claimed.dispatch_revision} OR attempts<5 THEN 'pending' ELSE 'failed' END`,
        attempts: sql`CASE WHEN dispatch_revision<>${claimed.dispatch_revision} THEN 0 ELSE attempts END`,
        available_at: sql`DATE_ADD(UTC_TIMESTAMP(), INTERVAL ${Math.min(300, 5 * 2 ** (claimed.attempts - 1))} SECOND)`,
        last_error: message.slice(0, 2000)
      })
      .where("id", "=", eventId)
      .where("status", "=", "processing")
      .execute();
    throw error;
  }
}

async function buildDocument(
  db: Kysely<SyncDatabase>,
  type: CrmFrappeSyncType,
  id: number,
  existingRemoteName: string | null,
  employeeCodeForEmail: (email: string, baseUrl: string) => Promise<string | null>,
  settings: FrappeSettings
) {
  if (type === "sop-item") {
    const value = await db
      .selectFrom("crm_sop_items as item")
      .innerJoin("crm_sops as sop", "sop.id", "item.sop_id")
      .innerJoin("crm_sop_item_revisions as revision", "revision.sop_item_id", "item.id")
      .select([
        "sop.title as sop_title",
        "item.title as item_title",
        "item.department",
        "item.frequency",
        "revision.instructions",
        "revision.evidence_guidance"
      ])
      .where("item.id", "=", id)
      .where("revision.status", "=", "published")
      .orderBy("revision.revision", "desc")
      .executeTakeFirst();
    if (!value)
      throw AppError.conflict("Publish an SOP Item revision before syncing it to Frappe.");
    const frequency = frappeDutyFrequency(value.frequency);
    const department = await resolveDutyDepartment(value.department, settings);
    return {
      path: "/api/resource/SOP Item",
      remoteName: existingRemoteName,
      payload: {
        sop_name: dutyItemName(value.sop_title, value.item_title),
        department,
        frequency,
        steps: dutyItemSteps(value.instructions, value.evidence_guidance)
      }
    };
  }
  if (type === "duty-assignment") {
    const value = await db
      .selectFrom("crm_duty_assignments as assignment")
      .innerJoin("crm_sop_items as item", "item.id", "assignment.sop_item_id")
      .innerJoin("app_users as person", "person.id", "assignment.assignee_user_id")
      .select(["item.id as item_id", "person.email", "assignment.display_order"])
      .where("assignment.id", "=", id)
      .executeTakeFirst();
    if (!value) throw AppError.notFound("Duty assignment was not found.");
    const remoteItem = await remoteNameFor(db, "sop-item", value.item_id);
    const employee = await employeeCodeForEmail(value.email, settings.baseUrl);
    if (!employee)
      throw AppError.conflict(`No active Frappe Employee mapping exists for ${value.email}.`);
    const remoteName =
      existingRemoteName ?? (await findRemoteAssignment(remoteItem, employee, settings));
    return {
      path: "/api/resource/SOP Assigned",
      remoteName,
      payload: { user: employee, sop_item: remoteItem, index: value.display_order }
    };
  }
  const value = await db
    .selectFrom("crm_duty_reports as report")
    .innerJoin("crm_duty_assignments as assignment", "assignment.id", "report.assignment_id")
    .innerJoin("crm_sop_items as item", "item.id", "assignment.sop_item_id")
    .innerJoin("app_users as person", "person.id", "report.assignee_user_id")
    .innerJoin("crm_sop_item_revisions as revision", "revision.id", "report.revision_id")
    .select([
      "revision.id as revision_id",
      "revision.instructions",
      "revision.evidence_guidance",
      "item.id as item_id",
      "person.email",
      "report.performed_date",
      "report.actions",
      "report.result",
      "report.issue_details"
    ])
    .where("report.id", "=", id)
    .executeTakeFirst();
  if (!value) throw AppError.notFound("Duty report was not found.");
  const remoteItem = await remoteNameFor(db, "sop-item", value.item_id);
  const employee = await employeeCodeForEmail(value.email, settings.baseUrl);
  if (!employee)
    throw AppError.conflict(`No active Frappe Employee mapping exists for ${value.email}.`);
  return {
    path: "/api/resource/SOP Reporting",
    remoteName: existingRemoteName,
    payload: {
      user: employee,
      sop_item: remoteItem,
      date: dutyReportDate(value.performed_date),
      actions: dutyReportActions(value.actions, value.result, value.issue_details, {
        revisionId: value.revision_id,
        instructions: value.instructions,
        evidenceGuidance: value.evidence_guidance
      })
    }
  };
}

async function findRemoteAssignment(item: string, employee: string, settings: FrappeSettings) {
  const query = new URLSearchParams({
    fields: JSON.stringify(["name"]),
    filters: JSON.stringify([
      ["sop_item", "=", item],
      ["user", "=", employee]
    ]),
    limit_page_length: "2"
  });
  const response = await requestFrappe<{ data?: Array<{ name: string }> }>(
    `/api/resource/SOP Assigned?${query}`,
    "GET",
    settings
  );
  if (
    !Array.isArray(response.data) ||
    response.data.some((row) => !row || typeof row.name !== "string" || !row.name)
  )
    throw AppError.conflict("Frappe returned an invalid SOP assignment lookup response.");
  if (response.data.length > 1)
    throw AppError.conflict("Multiple Frappe assignments match this SOP Item and Employee.");
  return response.data[0]?.name ?? null;
}

async function remoteNameFor(db: Kysely<SyncDatabase>, type: "sop-item", id: number) {
  const row = await db
    .selectFrom("crm_frappe_sync_queue")
    .select(["remote_name", "status"])
    .where("entity_type", "=", type)
    .where("local_record_id", "=", id)
    .executeTakeFirst();
  if (!row || row.status !== "synced" || !row.remote_name)
    throw AppError.conflict("Sync the referenced SOP Item to Frappe first.");
  return row.remote_name;
}
