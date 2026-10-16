import type { ColumnType, Generated, Kysely } from "kysely";
import type { DutyAssignmentDatabase } from "../duty-assignment/index.js";
export type DutyReportRow = { id: Generated<number>; uuid: Generated<string>; assignment_id: number; revision_id: number; assignee_user_id: number; performed_date: string; recurrence_key: string; actions: string; result: "completed" | "blocked"; issue_details: string; submitted_by: string; created_at: ColumnType<string, string | undefined, never> };
export type DutyReportDatabase = DutyAssignmentDatabase & { crm_duty_reports: DutyReportRow };
export type DutyReportInput = { assignmentId: number; performedDate: string; actions: string; result: "completed" | "blocked"; issueDetails: string };
export type DutyReport = { id: number; uuid: string; assignmentId: number; revisionId: number; assigneeUserId: number; performedDate: string; recurrenceKey: string; actions: string; result: "completed" | "blocked"; issueDetails: string; submittedBy: string; createdAt: string; itemTitle: string; sopTitle: string; assigneeName: string; frequency: string };
export type DutyReportContext = { database: Kysely<DutyReportDatabase>; actorEmail: string; actorUserId: number | null; authorize: (permission: string) => Promise<void>; queueSync?: (entity: "sop-item" | "duty-assignment" | "duty-report", id: number) => Promise<void> };
