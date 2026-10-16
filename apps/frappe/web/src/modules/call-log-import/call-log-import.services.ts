import { frappeRequest } from "../../frappe-request";
import type { FrappeCallLogPage } from "./call-log-import.types";

export const getFrappeCallLogs = (page: number) =>
  frappeRequest<FrappeCallLogPage>("GET", `/frappe/call-logs/remote?page=${page}`);
export const pullFrappeCallLog = (remoteName: string) =>
  frappeRequest<{ remoteName: string; localId: number; status: string }>(
    "POST",
    "/frappe/call-logs/pull",
    { remoteName }
  );
export const startFrappeCallLogImport = () =>
  frappeRequest<{ jobId: number; status: string }>("POST", "/frappe/call-logs/backfill", {});
export const getFrappeCallLogImport = (jobId: number) =>
  frappeRequest<{
    jobId: number;
    status: string;
    progress: { scanned: number; created: number; skipped: number; failed: number } | null;
    errorMessage: string | null;
  }>("GET", `/frappe/call-logs/backfill/${jobId}`);
