import { sportsclubRequest } from "../../sportsclub-request";
import type {
  AttendanceColumnFilters,
  AttendancePage,
  AttendanceRecord,
  AttendanceSavePayload
} from "./attendance.types";
export async function listAttendancePage(options: {
  page: number;
  pageSize: number;
  search: string;
  attendanceDate?: string | undefined;
  status?: string | undefined;
  columnFilters?: AttendanceColumnFilters | undefined;
}): Promise<AttendancePage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    search: options.search
  });
  if (options.attendanceDate) query.set("attendanceDate", options.attendanceDate);
  if (options.status && options.status !== "all") query.set("status", options.status);
  for (const [key, value] of Object.entries(options.columnFilters ?? {}))
    if (value) query.set(key, value);
  return sportsclubRequest<AttendancePage>(`/sportsclub/attendance?${query}`);
}
export async function getAttendance(uuid: string): Promise<AttendanceRecord> {
  return sportsclubRequest<AttendanceRecord>(`/sportsclub/attendance/${uuid}`);
}
export async function markAttendance(payload: AttendanceSavePayload): Promise<AttendanceRecord> {
  return sportsclubRequest<AttendanceRecord>("/sportsclub/attendance", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
export async function updateAttendance(
  uuid: string,
  payload: AttendanceSavePayload
): Promise<AttendanceRecord> {
  return sportsclubRequest<AttendanceRecord>(`/sportsclub/attendance/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
export async function deleteAttendance(uuid: string): Promise<{ success: boolean }> {
  return sportsclubRequest<{ success: boolean }>(`/sportsclub/attendance/${uuid}/force`, {
    method: "DELETE"
  });
}

export type AttendanceSessionOption = { uuid: string; title: string; status: string };
export type AttendanceMemberOption = { uuid: string; name: string; role: string; status: string };
type LookupPage<T> = { items: T[]; total: number };
export async function searchAttendanceSessions(
  search: string
): Promise<LookupPage<AttendanceSessionOption>> {
  return sportsclubRequest<LookupPage<AttendanceSessionOption>>(
    `/sportsclub/sessions/lookups?search=${encodeURIComponent(search)}&page=1`
  );
}
export async function searchAttendanceMembers(
  search: string
): Promise<LookupPage<AttendanceMemberOption>> {
  return sportsclubRequest<LookupPage<AttendanceMemberOption>>(
    `/sportsclub/members/lookups?search=${encodeURIComponent(search)}&page=1`
  );
}
export async function getAttendanceSession(uuid: string): Promise<AttendanceSessionOption> {
  return sportsclubRequest<AttendanceSessionOption>(`/sportsclub/sessions/${uuid}`);
}
export async function getAttendanceMember(uuid: string): Promise<AttendanceMemberOption> {
  return sportsclubRequest<AttendanceMemberOption>(`/sportsclub/members/${uuid}`);
}
