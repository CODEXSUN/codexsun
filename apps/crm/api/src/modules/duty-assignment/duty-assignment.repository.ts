import { randomUUID } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { DutyAssignment, DutyAssignmentDatabase, DutyAssignmentInput } from "./duty-assignment.types.js";
import { enqueueCrmFrappeSync } from "../frappe-sync/index.js";
import type { CrmFrappeSyncDatabase } from "../frappe-sync/index.js";

export class DutyAssignmentRepository {
  constructor(private readonly db: Kysely<DutyAssignmentDatabase>) {}
  async listForUser(userId: number) { const today = new Date().toISOString().slice(0, 10); return this.listBase().where("assignment.assignee_user_id", "=", userId).where("assignment.status", "=", "active").where("assignment.start_date", "<=", today).where((eb) => eb.or([eb("assignment.end_date", "is", null), eb("assignment.end_date", ">=", today)])).orderBy("assignment.display_order").execute().then((rows) => rows.map(map)); }
  async listAll() { return this.listBase().orderBy("assignment.created_at", "desc").execute().then((rows) => rows.map(map)); }
  private listBase() { return this.db.selectFrom("crm_duty_assignments as assignment").innerJoin("crm_sop_items as item", "item.id", "assignment.sop_item_id").innerJoin("crm_sop_item_revisions as revision", "revision.id", "assignment.revision_id").innerJoin("crm_sops as sop", "sop.id", "item.sop_id").innerJoin("app_users as person", "person.id", "assignment.assignee_user_id").select([
    "assignment.id", "assignment.uuid", "assignment.sop_item_id", "assignment.revision_id", "assignment.assignee_user_id", "assignment.display_order", "assignment.start_date", "assignment.end_date", "assignment.status", "assignment.assigned_by", "assignment.created_at", "sop.code as sop_code", "sop.title as sop_title", "item.code as item_code", "item.title as item_title", "item.department", "item.frequency", "revision.instructions", "revision.evidence_guidance", "person.name as assignee_name", "person.email as assignee_email"
  ]); }
  async create(input: DutyAssignmentInput, actor: string) {
    const id = await this.db.transaction().execute(async (trx) => {
      const revision = await trx.selectFrom("crm_sop_item_revisions as revision").innerJoin("crm_sop_items as item", "item.id", "revision.sop_item_id").innerJoin("crm_sops as sop", "sop.id", "item.sop_id").select(["revision.id", "revision.status", "item.status as item_status", "sop.status as sop_status"]).where("revision.id", "=", input.revisionId).where("revision.sop_item_id", "=", input.sopItemId).executeTakeFirst();
      const user = await trx.selectFrom("app_users").select("id").where("id", "=", input.assigneeUserId).where("status", "=", "active").executeTakeFirst();
      if (!revision || revision.status !== "published" || revision.item_status !== "active" || revision.sop_status !== "active" || !user) return null;
      const result = await trx.insertInto("crm_duty_assignments").values({ uuid: randomUUID(), sop_item_id: input.sopItemId, revision_id: input.revisionId, assignee_user_id: input.assigneeUserId, display_order: input.displayOrder, start_date: input.startDate, end_date: input.endDate, status: "active", assigned_by: actor }).executeTakeFirstOrThrow();
      await enqueueCrmFrappeSync(trx as unknown as Kysely<CrmFrappeSyncDatabase>, "duty-assignment", Number(result.insertId), actor);
      return Number(result.insertId);
    });
    return id ? (await this.listBase().where("assignment.id", "=", id).execute()).map(map)[0] ?? null : null;
  }
  async deactivate(id: number) { await this.db.updateTable("crm_duty_assignments").set({ status: "inactive", updated_at: sql`UTC_TIMESTAMP()` }).where("id", "=", id).execute(); }
}
function map(row: Record<string, any>): DutyAssignment { return { id: row.id, uuid: row.uuid, sopItemId: row.sop_item_id, revisionId: row.revision_id, assigneeUserId: row.assignee_user_id, displayOrder: row.display_order, startDate: String(row.start_date).slice(0, 10), endDate: row.end_date ? String(row.end_date).slice(0, 10) : null, status: row.status, assignedBy: row.assigned_by, sopCode: row.sop_code, sopTitle: row.sop_title, itemCode: row.item_code, itemTitle: row.item_title, department: row.department, frequency: row.frequency, instructions: row.instructions, evidenceGuidance: row.evidence_guidance, assigneeName: row.assignee_name, assigneeEmail: row.assignee_email, createdAt: new Date(row.created_at).toISOString() }; }
