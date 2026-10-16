import type { ColumnType, Generated } from "kysely";
import type { EnquiryDatabase } from "../enquiry/index.js";

export type ClosureRequestRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  enquiry_id: number;
  requested_by_user_id: number | null;
  requested_by: string;
  status: "pending" | "approved" | "rejected";
  request_note: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  requested_at: ColumnType<string, string | undefined, string>;
  reviewed_at: ColumnType<string | null, string | null | undefined, string | null>;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};

export type ClosureDatabase = EnquiryDatabase & {
  crm_closure_requests: ClosureRequestRow;
  app_users: { id: number; name: string; email: string; status: string };
  core_contacts: { id: number; name: string; primary_phone: string | null };
};

export type ClosureRequest = {
  id: number;
  enquiryId: number;
  enquiryNo: number;
  title: string;
  contact: string;
  requester: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
};
