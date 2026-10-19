import { sportsclubRequest } from "../../sportsclub-request";
import type {
  AttendanceColumnFilters,
  AttendancePage,
  AttendanceRecord,
  AttendanceSavePayload,
  AttendanceSummary
} from "./attendance.types";

export async function listAttendancePage(options: {
  page: number;
  pageSize: number;
  search: string;
  sessionDate?: string | undefined;
  status?: string | undefined;
  columnFilters?: AttendanceColumnFilters | undefined;
}): Promise<AttendancePage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    search: options.search
  });
  if (options.sessionDate) query.set("sessionDate", options.sessionDate);
  if (options.status && options.status !== "all") query.set("status", options.status);
  for (const [key, value] of Object.entries(options.columnFilters ?? {})) {
    if (value?.trim()) query.set(key, value.trim());
  }
  return sportsclubRequest<AttendancePage>(`/sportsclub/attendance?${query}`);
}

export async function markAttendance(
  payload: AttendanceSavePayload
): Promise<AttendanceRecord> {
  return sportsclubRequest<AttendanceRecord>("/sportsclub/attendance", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateAttendance(
  uuid: string,
  payload: AttendanceSavePayload,
  revision: number
): Promise<AttendanceRecord> {
  return sportsclubRequest<AttendanceRecord>(`/sportsclub/attendance/${uuid}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, revision })
  });
}

export async function deleteAttendance(
  uuid: string,
  revision: number
): Promise<{ success: boolean }> {
  return sportsclubRequest<{ success: boolean }>(`/sportsclub/attendance/${uuid}`, {
    method: "DELETE",
    body: JSON.stringify({ revision })
  });
}

export async function getAttendanceSummary(date: string): Promise<AttendanceSummary> {
  return sportsclubRequest<AttendanceSummary>(`/sportsclub/attendance/summary?date=${date}`);
}
