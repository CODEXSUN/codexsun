import type {
  AttendanceEmployee,
  AttendanceFilters,
  AttendanceInput,
  AttendanceOverview,
  AttendanceRecord
} from "./attendance.types";

export type AttendanceTransport = {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, input: unknown) => Promise<T>;
  put: <T>(path: string, input: unknown) => Promise<T>;
  delete: <T>(path: string) => Promise<T>;
};

export function createAttendanceGateway(request: AttendanceTransport) {
  return {
    list: (filters: AttendanceFilters) =>
      request.get<AttendanceRecord[]>(
        `/hrms/attendance?${new URLSearchParams({ date: filters.date, search: filters.search, status: filters.status })}`
      ),
    employees: () => request.get<AttendanceEmployee[]>("/hrms/attendance/employees"),
    overview: () => request.get<AttendanceOverview>("/hrms/attendance/overview"),
    create: (input: AttendanceInput) => request.post<AttendanceRecord>("/hrms/attendance", input),
    update: (id: string, input: AttendanceInput) =>
      request.put<AttendanceRecord>(`/hrms/attendance/${encodeURIComponent(id)}`, input),
    remove: (id: string) =>
      request.delete<AttendanceRecord>(`/hrms/attendance/${encodeURIComponent(id)}`),
    restore: (id: string) =>
      request.post<AttendanceRecord>(`/hrms/attendance/${encodeURIComponent(id)}/restore`, {})
  };
}
export type AttendanceGateway = ReturnType<typeof createAttendanceGateway>;
