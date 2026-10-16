import { AppError } from "@codexsun/framework/errors";
import type { CrmFrappeSyncType } from "@codexsun/crm-api";
import type { FrappeSettings } from "../connection/index.js";
import { requestFrappe } from "../connection/index.js";
import { sql, type Kysely } from "kysely";

import type { SyncDatabase, SyncResult } from "./crm-duty-sync.types.js";
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
  if (event.status === "synced" && event.remote_name)
    return { eventId, status: "synced", remoteName: event.remote_name };
  const claim = await database
    .updateTable("crm_frappe_sync_queue")
    .set({ status: "processing", attempts: sql`attempts + 1`, last_error: null })
    .where("id", "=", eventId)
    .where("status", "=", "pending")
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
  const claimed = await database
    .selectFrom("crm_frappe_sync_queue")
    .selectAll()
    .where("id", "=", eventId)
    .executeTakeFirstOrThrow();
  try {
    const { path, payload, remoteName } = await buildDocument(
      database,
      claimed.entity_type,
      claimed.local_record_id,
      claimed.remote_name,
      employeeCodeForEmail,
      settings.baseUrl
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
        status: sql`CASE WHEN last_error = 'Sync requested while processing.' THEN 'pending' ELSE 'synced' END`,
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
        status: claimed.attempts >= 5 ? "failed" : "pending",
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
  baseUrl: string
) {
  if (type === "sop-item") {
    const value = await db
      .selectFrom("crm_sop_items as item")
      .innerJoin("crm_sops as sop", "sop.id", "item.sop_id")
      .innerJoin("crm_sop_item_revisions as revision", "revision.sop_item_id", "item.id")
      .select([
        "sop.title as sop_title",
        "item.department",
        "item.frequency",
        "revision.instructions"
      ])
      .where("item.id", "=", id)
      .where("revision.status", "=", "published")
      .orderBy("revision.revision", "desc")
      .executeTakeFirst();
    if (!value)
      throw AppError.conflict("Publish an SOP Item revision before syncing it to Frappe.");
    return {
      path: "/api/resource/SOP Item",
      remoteName: existingRemoteName,
      payload: {
        sop_name: value.sop_title,
        department: value.department,
        frequency: value.frequency,
        steps: value.instructions
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
    const employee = await employeeCodeForEmail(value.email, baseUrl);
    if (!employee)
      throw AppError.conflict(`No active Frappe Employee mapping exists for ${value.email}.`);
    return {
      path: "/api/resource/SOP Assigned",
      remoteName: existingRemoteName,
      payload: { user: employee, sop_item: remoteItem, index: value.display_order }
    };
  }
  const value = await db
    .selectFrom("crm_duty_reports as report")
    .innerJoin("crm_duty_assignments as assignment", "assignment.id", "report.assignment_id")
    .innerJoin("crm_sop_items as item", "item.id", "assignment.sop_item_id")
    .innerJoin("app_users as person", "person.id", "report.assignee_user_id")
    .select(["item.id as item_id", "person.email", "report.performed_date", "report.actions"])
    .where("report.id", "=", id)
    .executeTakeFirst();
  if (!value) throw AppError.notFound("Duty report was not found.");
  const remoteItem = await remoteNameFor(db, "sop-item", value.item_id);
  const employee = await employeeCodeForEmail(value.email, baseUrl);
  if (!employee)
    throw AppError.conflict(`No active Frappe Employee mapping exists for ${value.email}.`);
  return {
    path: "/api/resource/SOP Reporting",
    remoteName: existingRemoteName,
    payload: {
      user: employee,
      sop_item: remoteItem,
      date: String(value.performed_date).slice(0, 10),
      actions: value.actions
    }
  };
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
