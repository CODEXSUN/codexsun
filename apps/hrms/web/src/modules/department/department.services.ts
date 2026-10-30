import type {
  DepartmentActivity,
  DepartmentFilters,
  DepartmentInput,
  DepartmentRecord,
  DepartmentStatus
} from "./department.types";

export type DepartmentTransport = {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, input?: unknown) => Promise<T>;
  put: <T>(path: string, input: unknown) => Promise<T>;
  delete: <T>(path: string) => Promise<T>;
};

export function createDepartmentGateway(request: DepartmentTransport) {
  return {
    list: (filters: DepartmentFilters) =>
      request.get<DepartmentRecord[]>(
        `/hrms/departments?${new URLSearchParams({
          search: filters.search,
          status: filters.status,
          deleted: filters.deleted ? "1" : "0"
        })}`
      ),
    get: (id: string) =>
      request.get<DepartmentRecord>(`/hrms/departments/${encodeURIComponent(id)}`),
    activity: (id: string) =>
      request.get<DepartmentActivity[]>(`/hrms/departments/${encodeURIComponent(id)}/activity`),
    create: (input: DepartmentInput) => request.post<DepartmentRecord>("/hrms/departments", input),
    update: (id: string, input: DepartmentInput) =>
      request.put<DepartmentRecord>(`/hrms/departments/${encodeURIComponent(id)}`, input),
    setStatus: (id: string, status: DepartmentStatus) =>
      request.post<DepartmentRecord>(`/hrms/departments/${encodeURIComponent(id)}/status`, {
        status
      }),
    restore: (id: string) =>
      request.post<DepartmentRecord>(`/hrms/departments/${encodeURIComponent(id)}/restore`),
    remove: (id: string) =>
      request.delete<DepartmentRecord>(`/hrms/departments/${encodeURIComponent(id)}`),
    forceDelete: (id: string) =>
      request.delete<DepartmentRecord>(`/hrms/departments/${encodeURIComponent(id)}/force`)
  };
}

export type DepartmentGateway = ReturnType<typeof createDepartmentGateway>;
