import type { ColumnType, Generated, Kysely } from "kysely";
import type { SopItemDatabase } from "../sop-item/index.js";

export type DutyAssignmentRow = {
  id: Generated<number>; uuid: Generated<string>; sop_item_id: number; revision_id: number;
  assignee_user_id: number; display_order: number; start_date: string; end_date: string | null;
  status: "active" | "inactive"; assigned_by: string;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};
export type DutyAssignmentDatabase = SopItemDatabase & {
  crm_duty_assignments: DutyAssignmentRow;
  app_users: { id: Generated<number>; name: string; email: string; status: string };
};
export type DutyAssignmentInput = { sopItemId: number; revisionId: number; assigneeUserId: number; displayOrder: number; startDate: string; endDate: string | null };
export type DutyAssignment = DutyAssignmentInput & {
  id: number; uuid: string; status: "active" | "inactive"; assignedBy: string;
  sopCode: string; sopTitle: string; itemCode: string; itemTitle: string; department: string;
  frequency: string; instructions: string; evidenceGuidance: string; assigneeName: string; assigneeEmail: string;
  createdAt: string;
};
export type DutyAssignmentContext = { database: Kysely<DutyAssignmentDatabase>; actorEmail: string; actorUserId: number | null; authorize: (permission: string) => Promise<void>; queueSync?: (entity: "sop-item" | "duty-assignment" | "duty-report", id: number) => Promise<void> };
