import type {
  DesignationActivity,
  DesignationFilters,
  DesignationInput,
  DesignationRecord,
  DesignationStatus
} from "./designation.types";

export type DesignationTransport = {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, input?: unknown) => Promise<T>;
  put: <T>(path: string, input: unknown) => Promise<T>;
  delete: <T>(path: string) => Promise<T>;
};

export function createDesignationGateway(request: DesignationTransport) {
  return {
    list: (filters: DesignationFilters) =>
      request.get<DesignationRecord[]>(
        `/hrms/designations?${new URLSearchParams({
          search: filters.search,
          status: filters.status,
          deleted: filters.deleted ? "1" : "0"
        })}`
      ),
    get: (id: string) =>
      request.get<DesignationRecord>(`/hrms/designations/${encodeURIComponent(id)}`),
    activity: (id: string) =>
      request.get<DesignationActivity[]>(`/hrms/designations/${encodeURIComponent(id)}/activity`),
    create: (input: DesignationInput) =>
      request.post<DesignationRecord>("/hrms/designations", input),
    update: (id: string, input: DesignationInput) =>
      request.put<DesignationRecord>(`/hrms/designations/${encodeURIComponent(id)}`, input),
    setStatus: (id: string, status: DesignationStatus) =>
      request.post<DesignationRecord>(`/hrms/designations/${encodeURIComponent(id)}/status`, {
        status
      }),
    restore: (id: string) =>
      request.post<DesignationRecord>(`/hrms/designations/${encodeURIComponent(id)}/restore`),
    remove: (id: string) =>
      request.delete<DesignationRecord>(`/hrms/designations/${encodeURIComponent(id)}`),
    forceDelete: (id: string) =>
      request.delete<DesignationRecord>(`/hrms/designations/${encodeURIComponent(id)}/force`)
  };
}

export type DesignationGateway = ReturnType<typeof createDesignationGateway>;
