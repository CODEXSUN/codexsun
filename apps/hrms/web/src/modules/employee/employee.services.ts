import type {
  EmployeeActivity,
  EmployeeFilters,
  EmployeeInput,
  EmployeeRecord,
  EmployeeStatus,
  EmployeeUserOption
} from "./employee.types";

export type EmployeeTransport = {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, input?: unknown) => Promise<T>;
  put: <T>(path: string, input: unknown) => Promise<T>;
  delete: <T>(path: string) => Promise<T>;
};
export function createEmployeeGateway(request: EmployeeTransport) {
  return {
    list: (filters: EmployeeFilters) =>
      request.get<EmployeeRecord[]>(
        `/hrms/employees?${new URLSearchParams({ search: filters.search, status: filters.status, deleted: filters.deleted ? "1" : "0" })}`
      ),
    get: (id: string) => request.get<EmployeeRecord>(`/hrms/employees/${encodeURIComponent(id)}`),
    users: () => request.get<EmployeeUserOption[]>("/hrms/employees/users"),
    activity: (id: string) =>
      request.get<EmployeeActivity[]>(`/hrms/employees/${encodeURIComponent(id)}/activity`),
    create: (input: EmployeeInput) => request.post<EmployeeRecord>("/hrms/employees", input),
    update: (id: string, input: EmployeeInput) =>
      request.put<EmployeeRecord>(`/hrms/employees/${encodeURIComponent(id)}`, input),
    setStatus: (id: string, status: EmployeeStatus) =>
      request.post<EmployeeRecord>(`/hrms/employees/${encodeURIComponent(id)}/status`, { status }),
    restore: (id: string) =>
      request.post<EmployeeRecord>(`/hrms/employees/${encodeURIComponent(id)}/restore`),
    remove: (id: string) =>
      request.delete<EmployeeRecord>(`/hrms/employees/${encodeURIComponent(id)}`),
    forceDelete: (id: string) =>
      request.delete<EmployeeRecord>(`/hrms/employees/${encodeURIComponent(id)}/force`)
  };
}
export type EmployeeGateway = ReturnType<typeof createEmployeeGateway>;
