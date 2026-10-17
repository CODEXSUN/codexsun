import type { Generated, Kysely, Transaction } from "kysely";
import type { TaskDatabase } from "../task/index.js";
import type { EnquiryDatabase } from "../enquiry/index.js";
export type WorkReportInput = {
 enquiryId: number | null; taskId: number | null;
 action: "check-in" | "check-out" | "report" | "assigned";
 body: string; requestId: string;
 latitude: number | null; longitude: number | null; accuracyMeters: number | null; capturedAt: string | null;
};
export type WorkReportRow = {
 id: Generated<number>; uuid: Generated<string>; enquiry_id: number | null; task_id: number | null;
 action: string; body: string; request_id: string; latitude: string | null; longitude: string | null;
 accuracy_meters: string | null; captured_at: string | null; created_by: string;
 created_at: Generated<Date>; updated_at: Generated<Date>; status: Generated<string>;
};
export type WorkReportDatabase = TaskDatabase & EnquiryDatabase & { crm_work_reports: WorkReportRow };
export type WorkMessage = { title: string; body: string; members: string[]; reference: string; eventUuid: string };
export type WorkReportContext = {
 database: Kysely<WorkReportDatabase>; actorEmail: string; actorUserId: number | null;
 authorize: (permission: string) => Promise<void>;
 sendMessage?: (transaction: Transaction<WorkReportDatabase>, message: WorkMessage) => Promise<void>;
};
export type WorkReportTarget = { enquiryId: number | null; taskId: number | null };
