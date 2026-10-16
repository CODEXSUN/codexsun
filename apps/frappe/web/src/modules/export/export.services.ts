import { frappeRequest } from "../../frappe-request";
import type { ExportJob, LocalExportPage } from "./export.types";

export const getLocalContacts = (page: number) =>
  frappeRequest<LocalExportPage>("GET", `/frappe/export/contacts?page=${page}`);
export const getLocalEnquiries = (page: number) =>
  frappeRequest<LocalExportPage>("GET", `/frappe/export/enquiries?page=${page}`);
export const getLocalActivities = (page: number) =>
  frappeRequest<LocalExportPage>("GET", `/frappe/export/activities?page=${page}`);
export const getLocalCallLogs = (page: number) =>
  frappeRequest<LocalExportPage>("GET", `/frappe/export/call-logs?page=${page}`);

export type ExportRequest =
  { ids: number[]; mode: "verify" } | { ids: number[]; mode: "export"; verifiedJobId: number };
export const queueContacts = (input: ExportRequest) =>
  frappeRequest<{ jobId: number; status: string }>("POST", "/frappe/export/contacts", input);
export const queueEnquiries = (input: ExportRequest) =>
  frappeRequest<{ jobId: number; status: string }>("POST", "/frappe/export/enquiries", input);
export const queueActivities = (input: ExportRequest) =>
  frappeRequest<{ jobId: number; status: string }>("POST", "/frappe/export/activities", input);
export const queueCallLogs = (input: ExportRequest) =>
  frappeRequest<{ jobId: number; status: string }>("POST", "/frappe/export/call-logs", input);

export const getExportJob = (jobId: number) =>
  frappeRequest<ExportJob>("GET", `/frappe/export/jobs/${jobId}`);
