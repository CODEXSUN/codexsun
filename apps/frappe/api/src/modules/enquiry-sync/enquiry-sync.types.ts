import type { Kysely } from "kysely";
import type { EnquiryInput, EnquiryRecord } from "@codexsun/crm-api/enquiry-sync";
import type { FrappeDatabase } from "../connection/index.js";

export type RemoteEnquiry = {
  name: string;
  title?: string | null;
  enquiry_details?: string | null;
  mobile?: string | null;
  customer?: string | null;
  date?: string | null;
  due_date?: string | null;
  priority?: string | null;
  status?: string | null;
  status_details?: string | null;
  modified?: string | null;
  user_employee?: string | null;
  assigned_to_employee?: string | null;
  group?: string | null;
};

export type ImportProgress = {
  scanned: number;
  created: number;
  skipped: number;
  failed: number;
  failures: { name: string; message: string }[];
};

export type EnquirySyncContext = {
  database: Kysely<FrappeDatabase>;
  createEnquiry: (input: EnquiryInput) => Promise<EnquiryRecord>;
  updateEnquiry: (id: number, input: EnquiryInput) => Promise<EnquiryRecord>;
  localUserForEmployee: (employeeCode: string, baseUrl: string) => Promise<number | null>;
  listInForName: (name: string) => Promise<number | null>;
};
